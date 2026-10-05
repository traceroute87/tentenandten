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
const OTHER_EMAIL = "second@example.test";
const OTHER_ID = "00000000-0000-4000-8000-0000000000e3";
const account = (email, id) => {
  const user = { id, aud: "authenticated", role: "authenticated", email, app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() };
  return { user, session: {
    access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: id, exp, aud: "authenticated", role: "authenticated", email })}.sig`,
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: `refresh-${id}`, user,
  } };
};
const ACCOUNTS = { [EMAIL]: account(EMAIL, USER_ID), [OTHER_EMAIL]: account(OTHER_EMAIL, OTHER_ID) };
const snapshot = { reach: 0, spread: 0, bring: 0, challenge_cycle: 1, challenge_history: [], voting_checklist: {}, own_state: null, referral_code: "ABCDEF", friends_started: 0, referral_starts: 0 };
const userFromAuth = (req) => {
  const token = (req.headers().authorization ?? "").replace(/^Bearer /, "");
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub; } catch { return null; }
};

const browser = await chromium.launch();
const failures = [];
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (error) { failures.push(name); console.log(`FAIL ${name}\n     ${String(error.message).split("\n")[0]}`); }
}

/** Opens the app with Supabase mocked; `calls` records every Supabase request by route. */
async function setup(viewport = { width: 1280, height: 900 }, { now } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900, timezoneId: "America/Chicago" });
  const calls = { otp: [], verify: [], user: 0, logout: 0, snapshot: 0, progress: [], reminderWrites: [], other: [] };
  // reminder_prefs mirrors the live table: a row per account created at signup, and
  // UPDATE granted only on (enabled, state), so an upsert on that row is rejected.
  const reminderRows = new Map();
  const failNextReminderWrite = { value: false };
  await ctx.route(/\.supabase\.co\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: body === undefined ? "" : JSON.stringify(body) });
    if (path === "/auth/v1/otp") { calls.otp.push(req.postDataJSON()); await new Promise((r) => setTimeout(r, 300)); return json(200, {}); }
    if (path === "/auth/v1/verify") {
      const body = req.postDataJSON();
      calls.verify.push(body);
      await new Promise((r) => setTimeout(r, 300));
      const acct = ACCOUNTS[body.email];
      if (body.token !== GOOD_CODE || !acct || body.type !== "email") return json(403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
      if (!reminderRows.has(acct.user.id)) reminderRows.set(acct.user.id, { enabled: false, state: null });
      return json(200, acct.session);
    }
    if (path === "/auth/v1/user") { calls.user++; const id = userFromAuth(req); return json(200, Object.values(ACCOUNTS).find((a) => a.user.id === id)?.user ?? {}); }
    if (path === "/auth/v1/logout") { calls.logout++; return route.fulfill({ status: 204 }); }
    if (path === "/rest/v1/rpc/app_snapshot") { calls.snapshot++; return json(200, snapshot); }
    if (path === "/rest/v1/progress") { calls.progress.push(req.postDataJSON()); return json(201); }
    if (path === "/rest/v1/reminder_prefs") {
      const id = userFromAuth(req);
      const row = reminderRows.get(id);
      if (req.method() === "GET") {
        const single = (req.headers().accept ?? "").includes("vnd.pgrst.object");
        return single ? (row ? json(200, row) : json(406, { code: "PGRST116" })) : json(200, row ? [row] : []);
      }
      calls.reminderWrites.push(`${req.method()} ${JSON.stringify(req.postDataJSON())}`);
      if (failNextReminderWrite.value) { failNextReminderWrite.value = false; return json(503, { message: "unavailable" }); }
      if (req.method() === "PATCH") {
        if (!row) return json(200, []);
        const body = req.postDataJSON();
        if ("user_id" in body) return json(403, { code: "42501", message: "permission denied for table reminder_prefs" });
        reminderRows.set(id, { ...row, ...body });
        return json(200, [{ user_id: id }]);
      }
      if (req.method() === "POST") {
        if (row && url.searchParams.has("on_conflict")) return json(403, { code: "42501", message: "permission denied for table reminder_prefs" });
        if (row) return json(409, { code: "23505", message: "duplicate key" });
        const body = req.postDataJSON();
        reminderRows.set(id, { enabled: body.enabled, state: body.state ?? null });
        return json(201);
      }
    }
    calls.other.push(`${req.method()} ${path}`);
    return path.startsWith("/rest/v1/rpc/") ? json(200, null) : route.fulfill({ status: 204 });
  });
  // One guest action, so sign-in has progress to adopt and sync.
  await ctx.addInitScript(() => {
    if (localStorage.getItem("t10.state.guest")) return;
    localStorage.setItem("t10.state.guest", JSON.stringify({ version: 2, profile: { createdAt: Date.now() }, challenge: { reach: { count: 1, log: [{ ts: Date.now(), kind: "manual" }] }, spread: { count: 0, log: [] }, bring: { count: 0, log: [] } }, challengeCycle: 1, challengeStartedAt: new Date().toISOString(), flags: { stateSetupDismissed: true } }));
  });
  // Any notification permission request is recorded (reminders must never ask).
  await ctx.addInitScript(() => {
    window.__notificationRequests = 0;
    if (window.Notification) window.Notification.requestPermission = async () => { window.__notificationRequests++; return "default"; };
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  if (now) await page.clock.setFixedTime(new Date(now));
  await page.goto(BASE + "/?app=1", { waitUntil: "networkidle", timeout: 30000 });
  const openMenu = async () => { await page.getByLabel("Menu").locator("visible=true").first().click(); await page.waitForTimeout(300); };
  await openMenu();
  return { ctx, page, calls, openMenu, reminderRows, failNextReminderWrite };
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

const signIn = async (page, email) => {
  await sendCode(page, email);
  await page.getByLabel("Verification code").fill(GOOD_CODE);
  await page.getByRole("button", { name: "Verify code" }).click();
  await page.getByText(`Signed in as ${email}`).waitFor();
  await page.waitForTimeout(800);
};
const reminders = (page) => ({
  async open() { await page.getByLabel("Reminders").locator("visible=true").first().click(); await page.waitForTimeout(500); },
  async close() {
    const x = page.getByRole("button", { name: "Close sheet" }).locator("visible=true");
    if (await x.count()) await x.first().click(); else await page.goBack();
    await page.waitForTimeout(500);
  },
  box: () => page.locator(".sheet input[type=checkbox]"),
});
const closeMenu = async (page) => { await page.goBack(); await page.waitForTimeout(400); };

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  await check(`${viewport.width}px signed-in reminders persist through close/reopen and reload; accounts and guest stay separate`, async () => {
    const { ctx, page, calls, openMenu, reminderRows } = await setup(viewport);
    const r = reminders(page);
    try {
      await signIn(page, EMAIL);
      await closeMenu(page);
      await r.open();
      assert.equal(await r.box().isChecked(), false);
      await r.box().check();
      await r.close(); // immediately: closing must not cancel the save
      await page.waitForTimeout(800);
      assert.equal(reminderRows.get(USER_ID).enabled, true, `server not saved; writes: ${calls.reminderWrites.join(" | ")}`);
      await r.open();
      assert.equal(await r.box().isChecked(), true, "unchecked after close/reopen");
      await r.close();
      await page.reload({ waitUntil: "networkidle" });
      await r.open();
      assert.equal(await r.box().isChecked(), true, "unchecked after reload");
      await r.box().uncheck();
      await r.close();
      await page.waitForTimeout(800);
      assert.equal(reminderRows.get(USER_ID).enabled, false, "uncheck not saved");
      await r.open();
      assert.equal(await r.box().isChecked(), false, "uncheck lost after reopen");
      await r.box().check(); // leave account A on
      await r.close();
      await page.waitForTimeout(800);

      await openMenu();
      await page.getByText("Log Out").click();
      await page.waitForTimeout(600);
      await r.open();
      assert.equal(await r.box().isChecked(), false, "guest shows account A's reminder");
      await r.close();

      await openMenu();
      await signIn(page, OTHER_EMAIL);
      await closeMenu(page);
      await r.open();
      assert.equal(await r.box().isChecked(), false, "account B shows account A's reminder");
      assert.equal(reminderRows.get(USER_ID).enabled, true, "account A's server value changed");
      assert.equal(reminderRows.get(OTHER_ID).enabled, false, "account B's server value changed");
    } finally { await ctx.close(); }
  });
}

await check("guest reminders persist through close/reopen and reload, and unchecking persists", async () => {
  const { ctx, page } = await setup({ width: 390, height: 844 });
  const r = reminders(page);
  try {
    await closeMenu(page);
    await r.open();
    await r.box().check();
    await r.close();
    await r.open();
    assert.equal(await r.box().isChecked(), true, "unchecked after close/reopen");
    await r.close();
    await page.reload({ waitUntil: "networkidle" });
    await r.open();
    assert.equal(await r.box().isChecked(), true, "unchecked after reload");
    await r.box().uncheck();
    await r.close();
    await page.reload({ waitUntil: "networkidle" });
    await r.open();
    assert.equal(await r.box().isChecked(), false, "uncheck lost after reload");
  } finally { await ctx.close(); }
});

const homeReminder = (page) => page.evaluate(() => [...document.querySelectorAll(".reminder")].map((el) => el.querySelector("b")?.textContent ?? el.textContent).filter((t) => !t.startsWith("Today's the day")));

await check("Home reminder banner follows per-reminder local dates (Chicago time, mid-afternoon)", async () => {
  const expected = [
    ["2026-10-05", "Registration deadlines are approaching in many states."],
    ["2026-10-15", "Early voting is starting in many states."],
    ["2026-10-23", "Early voting is starting in many states."],
    ["2026-10-24", null],
    ["2026-11-02", "Election Day is tomorrow — finalize your plan."],
    ["2026-11-03", "Today is Election Day."],
    ["2026-11-04", null],
    ["2026-11-06", null],
  ];
  for (const [day, label] of expected) {
    const { ctx, page } = await setup({ width: 390, height: 844 }, { now: `${day}T15:00:00-05:00` });
    try {
      await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("t10.state.guest"));
        localStorage.setItem("t10.state.guest", JSON.stringify({ ...s, reminders: { enabled: true } }));
      });
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual(await homeReminder(page), label ? [label] : [], `${day}`);
    } finally { await ctx.close(); }
  }
});

await check("enabling shows the banner on Home at once, disabling hides it, no banner elsewhere, no notification prompt", async () => {
  const { ctx, page } = await setup({ width: 1280, height: 900 }, { now: "2026-10-15T15:00:00-05:00" });
  const r = reminders(page);
  try {
    await closeMenu(page);
    assert.deepEqual(await homeReminder(page), []);
    await r.open();
    const dialog = await page.locator(".sheet").innerText();
    assert.ok(dialog.includes("Show election reminders on Home"), "toggle wording");
    assert.ok(!/no spam|nudges/i.test(dialog), "dialog still implies sent notifications");
    assert.equal(await page.locator(".sheet select").count(), 0, "state dropdown still in Reminders");
    await r.box().check();
    await r.close();
    assert.deepEqual(await homeReminder(page), ["Early voting is starting in many states."]);
    for (const path of ["/challenge/reach", "/voting", "/impact"]) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".reminder").count(), 0, `banner shown on ${path}`);
    }
    await page.goto(BASE + "/?app=1", { waitUntil: "networkidle" });
    await r.open();
    await r.box().uncheck();
    await r.close();
    assert.deepEqual(await homeReminder(page), [], "banner still shown after disabling");
    assert.equal(await page.evaluate(() => window.__notificationRequests), 0, "notification permission requested");
  } finally { await ctx.close(); }
});

await check("an expired sign-in link shows a neutral notice once and cleans the URL", async () => {
  const { ctx, page } = await setup();
  try {
    await page.goto("about:blank"); // a link from an email is a fresh page load
    await page.goto(BASE + "/?app=1#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired", { waitUntil: "networkidle" });
    const notice = page.getByRole("alert").filter({ hasText: "sign-in link" });
    await notice.waitFor();
    assert.equal(await notice.innerText().then((t) => t.includes("That sign-in link is invalid or has expired.")), true);
    assert.equal(new URL(page.url()).hash, "", "error params left in the URL");
    assert.equal(new URL(page.url()).search, "?app=1");
    await notice.getByRole("button", { name: "OK" }).click();
    assert.equal(await notice.count(), 0, "notice not dismissed");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.getByRole("alert").filter({ hasText: "sign-in link" }).count(), 0, "notice came back after reload");
  } finally { await ctx.close(); }
});

await check("a rejected analytics event is dropped instead of blocking later events", async () => {
  const { ctx, page, calls } = await setup();
  try {
    await page.route(/rpc\/record_analytics_event/, async (route) => {
      const body = route.request().postDataJSON();
      calls.other.push(`analytics ${body.p_event}`);
      return body.p_event === "action_completed"
        ? route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "42883" }) })
        : route.fulfill({ status: 204 });
    });
    await page.goto(BASE + "/challenge/reach", { waitUntil: "networkidle" });
    for (let i = 0; i < 3; i++) { await page.getByRole("button", { name: "Mark One Complete" }).click(); await page.waitForTimeout(300); }
    await page.waitForTimeout(800);
    const queue = await page.evaluate(() => JSON.parse(localStorage.getItem("t10.analytics.queue") || "[]"));
    assert.equal(queue.length, 0, `queue stuck with ${queue.map((e) => e.event).join(", ")}`);
    assert.ok(calls.other.filter((c) => c === "analytics action_completed").length >= 3, "later events were not attempted");
  } finally { await ctx.close(); }
});

const totals = (page) => page.evaluate(([a, b]) => {
  const total = (key) => { const s = JSON.parse(localStorage.getItem(key) || "null"); return s ? s.challenge.reach.count + s.challenge.spread.count + s.challenge.bring.count : null; };
  return { guest: total("t10.state.guest"), A: total(`t10.state.account.${a}`), B: total(`t10.state.account.${b}`), guestFlags: JSON.parse(localStorage.getItem("t10.state.guest") || "{}").flags ?? {} };
}, [USER_ID, OTHER_ID]);
const logActions = async (page, n) => {
  await page.goto(BASE + "/challenge/reach", { waitUntil: "networkidle" });
  for (let i = 0; i < n; i++) { await page.getByRole("button", { name: "Mark One Complete" }).click(); await page.waitForTimeout(80); }
  await page.goto(BASE + "/?app=1", { waitUntil: "networkidle" });
};
const logOut = async (page, openMenu) => { await openMenu(); await page.getByText("Log Out").click(); await page.waitForTimeout(700); };

await check("guest progress moves to each new account; guest is empty after sign-out; accounts stay separate", async () => {
  const { ctx, page, openMenu } = await setup(); // guest starts with 1 action
  try {
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("t10.state.guest"));
      localStorage.setItem("t10.state.guest", JSON.stringify({ ...s, flags: { ...s.flags, installDismissed: true } }));
    });
    await closeMenu(page);
    await logActions(page, 4); // guest 5/30
    assert.equal((await totals(page)).guest, 5);

    await openMenu();
    await signIn(page, EMAIL);
    let t = await totals(page);
    assert.equal(t.A, 5, "account A did not adopt 5/30");
    assert.equal(t.guest, 0, "guest not cleared after adoption");
    assert.equal(t.guestFlags.installDismissed, true, "device install flag lost");
    assert.equal(t.guestFlags.stateSetupDismissed, true, "device state-setup flag lost");
    await closeMenu(page);
    await logOut(page, openMenu);
    assert.ok(await page.getByText("0 / 30 actions completed").isVisible(), "guest Home not empty after sign-out");

    await logActions(page, 3); // new guest progress 3/30
    await openMenu();
    await signIn(page, OTHER_EMAIL);
    t = await totals(page);
    assert.deepEqual([t.A, t.B, t.guest], [5, 3, 0], "B must get only the new guest progress, A unchanged, guest cleared");
    await closeMenu(page);
    await logOut(page, openMenu);
    assert.equal((await totals(page)).guest, 0);

    await openMenu();
    await signIn(page, EMAIL); // existing account on this device: no adoption, still 5
    t = await totals(page);
    assert.deepEqual([t.A, t.B, t.guest], [5, 3, 0]);
    await closeMenu(page);
    assert.ok(await page.getByText("5 / 30 actions completed").isVisible(), "account A Home does not show its 5/30");
  } finally { await ctx.close(); }
});

await check("if saving the account copy fails, guest progress is kept and nothing is adopted", async () => {
  const { ctx, page, openMenu } = await setup();
  try {
    await closeMenu(page);
    await logActions(page, 2); // guest 3/30
    await page.evaluate(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (String(key).startsWith("t10.state.account.")) throw new DOMException("quota", "QuotaExceededError");
        return real.call(this, key, value);
      };
    });
    await openMenu();
    await signIn(page, EMAIL);
    const t = await totals(page);
    assert.equal(t.guest, 3, "guest progress erased by a failed adoption");
    assert.equal(t.A, null, "account copy should not exist in storage");
    await closeMenu(page);
    await logOut(page, openMenu);
    assert.ok(await page.getByText("3 / 30 actions completed").isVisible(), "guest Home lost its progress");
  } finally { await ctx.close(); }
});

await check("a failed reminder save keeps the local choice and is retried instead of reverting", async () => {
  const { ctx, page, reminderRows, failNextReminderWrite } = await setup();
  const r = reminders(page);
  try {
    await signIn(page, EMAIL);
    await closeMenu(page);
    await r.open();
    failNextReminderWrite.value = true;
    await r.box().check();
    await page.getByText("Couldn't save reminder settings yet.", { exact: false }).waitFor();
    await r.close();
    await r.open();
    assert.equal(await r.box().isChecked(), true, "stale server value overwrote the unsaved choice");
    await page.waitForTimeout(800);
    assert.equal(reminderRows.get(USER_ID).enabled, true, "unsaved choice was not retried on reopen");
  } finally { await ctx.close(); }
});

await browser.close();
if (failures.length) { console.log(`\n${failures.length} email code check(s) failed against ${BASE}`); process.exit(1); }
console.log(`\nemail code sign-in OK against ${BASE}`);
