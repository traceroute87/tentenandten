// Email one-time-code sign-in against a running build, with only the Supabase HTTP
// boundary mocked (no inbox, no real auth). Usage: E2E_BASE=<url> npm run test:otp
// (defaults to `npm run preview` on http://localhost:4173; the build needs VITE_SUPABASE_*).
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = (process.env.E2E_BASE || "http://localhost:4173").replace(/\/$/, "");
const EMAIL = "voter@example.test";
const GOOD_CODE = "123456";
const USER_ID = "00000000-0000-4000-8000-0000000000e2";

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 3600;
const user = { id: USER_ID, aud: "authenticated", role: "authenticated", email: EMAIL, app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() };
const session = {
  access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, exp, aud: "authenticated", role: "authenticated", email: EMAIL })}.sig`,
  token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "refresh-e2e", user,
};
const snapshot = { reach: 0, spread: 0, bring: 0, challenge_cycle: 1, challenge_history: [], voting_checklist: {}, own_state: null, referral_code: "ABCDEF", friends_started: 0, referral_starts: 0 };

const browser = await chromium.launch();
const failures = [];
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (error) { failures.push(name); console.log(`FAIL ${name}\n     ${String(error.message).split("\n")[0]}`); }
}

/** Opens the app with Supabase mocked; `calls` records every Supabase request by route. */
async function setup(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900 });
  const calls = { otp: [], verify: [], user: 0, logout: 0, snapshot: 0, progress: [], other: [] };
  await ctx.route(/\.supabase\.co\//, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: body === undefined ? "" : JSON.stringify(body) });
    if (path === "/auth/v1/otp") { calls.otp.push(req.postDataJSON()); await new Promise((r) => setTimeout(r, 300)); return json(200, {}); }
    if (path === "/auth/v1/verify") {
      const body = req.postDataJSON();
      calls.verify.push(body);
      await new Promise((r) => setTimeout(r, 300));
      return body.token === GOOD_CODE && body.email === EMAIL && body.type === "email"
        ? json(200, session)
        : json(403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
    }
    if (path === "/auth/v1/user") { calls.user++; return json(200, user); }
    if (path === "/auth/v1/logout") { calls.logout++; return route.fulfill({ status: 204 }); }
    if (path === "/rest/v1/rpc/app_snapshot") { calls.snapshot++; return json(200, snapshot); }
    if (path === "/rest/v1/progress") { calls.progress.push(req.postDataJSON()); return json(201); }
    calls.other.push(`${req.method()} ${path}`);
    return path.startsWith("/rest/v1/rpc/") ? json(200, null) : route.fulfill({ status: 204 });
  });
  // One guest action, so sign-in has progress to adopt and sync.
  await ctx.addInitScript(() => {
    if (localStorage.getItem("t10.state.guest")) return;
    localStorage.setItem("t10.state.guest", JSON.stringify({ version: 2, profile: { createdAt: Date.now() }, challenge: { reach: { count: 1, log: [{ ts: Date.now(), kind: "manual" }] }, spread: { count: 0, log: [] }, bring: { count: 0, log: [] } }, challengeCycle: 1, challengeStartedAt: new Date().toISOString(), flags: { stateSetupDismissed: true } }));
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  await page.goto(BASE + "/?app=1", { waitUntil: "networkidle" });
  const openMenu = async () => { await page.getByLabel("Menu").locator("visible=true").first().click(); await page.waitForTimeout(300); };
  await openMenu();
  return { ctx, page, calls, openMenu };
}
const sendCode = async (page, email = EMAIL) => {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByText("Check your email").waitFor();
};

await check("email -> code step: one request, address shown, code field focused with OTP hints", async () => {
  const { ctx, page, calls } = await setup();
  try {
    await page.getByLabel("Email", { exact: true }).fill(EMAIL);
    await page.getByRole("button", { name: "Send code" }).dblclick();
    await page.getByText("Check your email").waitFor();
    await page.waitForTimeout(500);
    assert.equal(calls.otp.length, 1, `Send code double-click sent ${calls.otp.length} requests`);
    assert.equal(calls.otp[0].email, EMAIL);
    assert.equal(calls.otp[0].create_user, true);
    assert.ok(await page.getByText(EMAIL, { exact: true }).isVisible(), "address not shown");
    const field = await page.evaluate(() => { const el = document.activeElement; return { auto: el?.getAttribute("autocomplete"), mode: el?.getAttribute("inputmode") }; });
    assert.deepEqual(field, { auto: "one-time-code", mode: "numeric" }, "code field not focused or missing hints");
    assert.ok(await page.getByRole("button", { name: /Resend code \(\d+s\)/ }).isDisabled(), "resend not cooling down");
  } finally { await ctx.close(); }
});

await check("invalid code: neutral error, email and code kept, can retry", async () => {
  const { ctx, page, calls } = await setup();
  try {
    await sendCode(page);
    await page.getByLabel("Verification code").fill("000000");
    await page.getByRole("button", { name: "Verify code" }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.getByRole("alert").innerText(), "That code is invalid or has expired.");
    assert.ok(await page.getByText(EMAIL, { exact: true }).isVisible(), "email cleared after error");
    assert.equal(await page.getByLabel("Verification code").inputValue(), "000000");
    assert.equal(calls.verify.length, 1);
    assert.equal(calls.verify[0].type, "email");
  } finally { await ctx.close(); }
});

await check("resend after cooldown sends a new code; Use a different email returns with the address kept", async () => {
  const { ctx, page, calls } = await setup();
  try {
    await page.clock.install();
    await sendCode(page);
    await page.clock.runFor(61_000);
    await page.getByRole("button", { name: "Resend code", exact: true }).click();
    await page.getByRole("status").waitFor();
    assert.equal(calls.otp.length, 2, `resend made ${calls.otp.length} requests in total`);
    await page.getByRole("button", { name: "Use a different email" }).click();
    assert.equal(await page.getByLabel("Email", { exact: true }).inputValue(), EMAIL);
    assert.ok(await page.getByRole("button", { name: "Send code" }).isVisible());
  } finally { await ctx.close(); }
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  await check(`${viewport.width}px verify success: one verify, session, guest progress adopted, account sync, sign out`, async () => {
    const { ctx, page, calls, openMenu } = await setup(viewport);
    try {
      await sendCode(page);
      await page.getByLabel("Verification code").fill(" 123 456 "); // pasted with spaces
      assert.equal(await page.getByLabel("Verification code").inputValue(), GOOD_CODE);
      await page.getByRole("button", { name: "Verify code" }).dblclick();
      await page.getByText(`Signed in as ${EMAIL}`).waitFor();
      await page.waitForTimeout(1500);
      assert.equal(calls.verify.length, 1, `Verify double-click sent ${calls.verify.length} requests`);
      assert.ok(calls.snapshot >= 1, "account sync did not fetch app_snapshot");
      assert.ok(calls.progress.some((row) => row.user_id === USER_ID && row.reach === 1), "guest progress was not synced to the account");
      const stored = await page.evaluate((id) => JSON.parse(localStorage.getItem(`t10.state.account.${id}`) || "null")?.challenge.reach.count, USER_ID);
      assert.equal(stored, 1, "guest progress not adopted into the account namespace");
      await page.getByText("Log Out").click();
      await page.waitForTimeout(600);
      assert.equal(calls.logout, 1);
      await openMenu();
      assert.ok(await page.getByRole("button", { name: "Send code" }).isVisible(), "sign-in form not back after sign out");
      assert.equal(await page.getByText(`Signed in as ${EMAIL}`).count(), 0);
    } finally { await ctx.close(); }
  });
}

await browser.close();
if (failures.length) { console.log(`\n${failures.length} email code check(s) failed against ${BASE}`); process.exit(1); }
console.log(`\nemail code sign-in OK against ${BASE}`);
