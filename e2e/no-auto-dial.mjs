// tel:/sms: regression check against a running build.
// Usage: E2E_BASE=https://<deployment>.pages.dev node e2e/no-auto-dial.mjs
//        (defaults to `npm run preview` on http://localhost:4173)
// iOS Safari blocks a tel: navigation that is not tied to a user tap ("This
// website has been blocked from automatically starting a call"). Desktop
// browsers never show that prompt, so instead this records every tel:/sms:
// navigation request (CDP Page.frameRequestedNavigation) and asserts one only
// happens right after the matching Call/Text control is clicked.
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = (process.env.E2E_BASE || "http://localhost:4173").replace(/\/$/, "");
const DIAL = /^(tel|sms):/i;

const browser = await chromium.launch();
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`FAIL ${name}\n     ${String(error.message).split("\n")[0]}`);
  }
}

const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

async function openPage(path, { platform = "ios", picker = false, standalone = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: platform === "android" ? ANDROID_UA : IOS_UA,
    isMobile: true,
    hasTouch: true,
  });
  if (standalone) {
    await ctx.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
      const nativeMatchMedia = window.matchMedia;
      window.matchMedia = (query) => query === "(display-mode: standalone)"
        ? { matches: true, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
        : nativeMatchMedia.call(window, query);
    });
  }
  if (picker) {
    await ctx.addInitScript(() => {
      Object.defineProperty(navigator, "contacts", { configurable: true, value: { select: async () => [{ name: ["Ana"], tel: ["+1 (555) 123-4567"] }] } });
    });
  }
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Page.enable");
  const dials = [];
  cdp.on("Page.frameRequestedNavigation", (e) => { if (DIAL.test(e.url)) dials.push(e); });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.count()) await skip.first().click();
  await page.waitForTimeout(800);
  // Returns and clears the tel:/sms: navigations seen since the last call.
  const take = async (settle = 400) => {
    await page.waitForTimeout(settle);
    return dials.splice(0).map((e) => e.url);
  };
  return { ctx, page, take };
}

await check("iOS Safari shows the number field and does not navigate on load", async () => {
  const { ctx, page, take } = await openPage("/challenge/reach");
  try {
    assert.equal(await page.getByLabel("Phone number").getAttribute("placeholder"), "Phone number");
    assert.deepEqual(await take(1000), [], "direct load dialed");
    await page.goto(BASE + "/?app=1", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Call or Text Someone/ }).click();
    await page.waitForURL(/\/challenge\/reach$/);
    assert.deepEqual(await take(1000), [], "opening from Home dialed");
  } finally {
    await ctx.close();
  }
});

await check("iOS standalone/PWA also shows the number field", async () => {
  const { ctx, page } = await openPage("/challenge/reach", { standalone: true });
  try {
    assert.equal(await page.getByLabel("Phone number").count(), 1, "PWA number field missing");
  } finally {
    await ctx.close();
  }
});

await check("Android keeps the existing dialer link and does not require a number", async () => {
  const { ctx, page } = await openPage("/challenge/reach", { platform: "android" });
  try {
    assert.equal(await page.getByLabel("Phone number").count(), 0, "Android number field shown");
    assert.equal(await page.locator(".track__actions a.chip", { hasText: "Call" }).getAttribute("href"), "tel:");
  } finally {
    await ctx.close();
  }
});

await check("Mark One Complete and 'I already contacted someone' do not navigate to tel:/sms:", async () => {
  const { ctx, page, take } = await openPage("/challenge/reach");
  try {
    await page.getByRole("button", { name: "Mark One Complete" }).click();
    assert.deepEqual(await take(), [], "Mark One Complete dialed");
    await page.getByRole("button", { name: "I already contacted someone" }).click();
    assert.deepEqual(await take(), [], "'already contacted' dialed");
    await page.getByRole("tab", { name: "Share 10" }).click();
    await page.getByRole("tab", { name: "Reach 10" }).click();
    assert.deepEqual(await take(), [], "tab switch dialed");
  } finally {
    await ctx.close();
  }
});

await check("opening and closing message presets does not navigate to tel:/sms:", async () => {
  const { ctx, page, take } = await openPage("/challenge/reach");
  try {
    await page.locator(".challenge-message-preset").click();
    await page.locator(".sheet").waitFor();
    assert.deepEqual(await take(800), [], "opening presets dialed");
    await page.getByLabel("Recipient first name (optional)").fill("Sam");
    assert.deepEqual(await take(), [], "editing presets dialed");
    await page.goBack();
    assert.deepEqual(await take(800), [], "closing presets dialed");
  } finally {
    await ctx.close();
  }
});

await check("no bare tel: link anywhere on Reach 10", async () => {
  const { ctx, page } = await openPage("/challenge/reach");
  try {
    const bare = await page.locator("a[href]").evaluateAll((as) =>
      as.map((a) => a.getAttribute("href")).filter((h) => /^tel:\s*$/i.test(h)));
    assert.deepEqual(bare, [], "bare tel: link rendered");
  } finally {
    await ctx.close();
  }
});

await check("iOS empty or too-short number cannot start a call", async () => {
  const { ctx, page, take } = await openPage("/challenge/reach");
  try {
    const call = page.locator(".track__actions .chip", { hasText: /^\s*Call\s*$/ });
    for (const value of ["", "  ", "12-34", "abc"]) {
      await page.getByLabel("Phone number").fill(value);
      assert.equal(await call.evaluate((el) => el.tagName), "BUTTON", `"${value}": Call is a link`);
      assert.ok(await call.isDisabled(), `"${value}": Call not disabled`);
      await call.click({ force: true });
      assert.deepEqual(await take(), [], `"${value}": Call dialed`);
    }
  } finally {
    await ctx.close();
  }
});

await check("iOS entered number: Call opens tel:<number>, Text opens sms:<number>, only on tap", async () => {
  const { ctx, page, take } = await openPage("/challenge/reach");
  try {
    await page.getByLabel("Phone number").fill("+1 (555) 123-4567");
    assert.deepEqual(await take(), [], "typing a number dialed");
    await page.locator(".track__actions a.chip", { hasText: "Call" }).click();
    assert.deepEqual(await take(), ["tel:+15551234567"], "Call");
    await page.locator(".track__actions a.chip", { hasText: "Text" }).click();
    assert.deepEqual(await take(), ["sms:+15551234567"], "Text");
    await page.getByLabel("Phone number").fill("");
    await page.locator(".track__actions a.chip", { hasText: "Text" }).click();
    assert.deepEqual(await take(), ["sms:"], "Text without a number (opens Messages to pick recipients)");
    await page.locator(".challenge-message-preset").click();
    await page.getByRole("button", { name: "Open Text Message" }).click();
    const [url, ...rest] = await take();
    assert.ok(url?.startsWith("sms:") && rest.length === 0, `preset Text sent ${url} + ${rest.length} more`);
  } finally {
    await ctx.close();
  }
});

await check("unsupported Contact Picker hides Choose Contact", async () => {
  const { ctx, page } = await openPage("/challenge/reach");
  try {
    assert.equal(await page.evaluate(() => "contacts" in navigator), false, "test browser unexpectedly has a picker");
    assert.equal(await page.getByRole("button", { name: "Choose Contact" }).count(), 0, "dead Choose Contact shown");
  } finally {
    await ctx.close();
  }
});

await check("supported Contact Picker fills the number but never dials by itself", async () => {
  const { ctx, page, take } = await openPage("/challenge/reach", { picker: true });
  try {
    await page.getByRole("button", { name: "Choose Contact" }).click();
    assert.deepEqual(await take(800), [], "picking a contact dialed without a tap");
    assert.equal(await page.getByLabel("Phone number").inputValue(), "+1 (555) 123-4567", "number not filled");
    await page.locator(".track__actions a.chip", { hasText: "Call" }).click();
    assert.deepEqual(await take(), ["tel:+15551234567"], "Call after picking");
  } finally {
    await ctx.close();
  }
});

await browser.close();
if (failures.length) {
  console.log(`\n${failures.length} tel:/sms: check(s) failed against ${BASE}`);
  process.exit(1);
}
console.log(`\nno auto-dial OK against ${BASE}`);
