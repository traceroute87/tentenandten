// Overlay/page stability regression check against a running build.
// Usage: E2E_BASE=https://<deployment>.pages.dev npm run test:e2e
//        (defaults to `npm run preview` on http://localhost:4173)
// Guards the overlay history loop: a sheet's history entry must not remount the
// page or the sheet, desktop dialogs must stay centered, Back must close first.
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = (process.env.E2E_BASE || "http://localhost:4173").replace(/\/$/, "");

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

async function openPage(viewport, path) {
  const ctx = await browser.newContext({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900 });
  await ctx.addInitScript(() => {
    window.__mounts = { sheet: 0, body: 0 };
    new MutationObserver((records) => {
      for (const r of records) for (const n of r.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches(".sheet-backdrop")) window.__mounts.sheet++;
        if (n.matches(".screen__body") || n.querySelector(".screen__body")) window.__mounts.body++;
      }
    }).observe(document, { childList: true, subtree: true });
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.count()) await skip.first().click();
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__mounts = { sheet: 0, body: 0 }; });
  return { ctx, page };
}

// Samples the open dialog's top edge every frame for `ms`.
const sampleDialog = (page, ms) => page.evaluate((ms) => new Promise((resolve) => {
  const tops = [];
  const t0 = performance.now();
  const tick = () => {
    const sheet = document.querySelector(".sheet-backdrop:not(.is-closing) .sheet");
    if (sheet) {
      const r = sheet.getBoundingClientRect();
      tops.push({ top: r.top, mid: r.top + r.height / 2 });
    }
    if (performance.now() - t0 < ms) requestAnimationFrame(tick);
    else resolve(tops);
  };
  requestAnimationFrame(tick);
}), ms);

await check("desktop Share My Progress: one mount, centered, stable, page not remounted, Back closes", async () => {
  const viewport = { width: 1280, height: 900 };
  const { ctx, page } = await openPage(viewport, "/impact");
  try {
    for (let round = 1; round <= 3; round++) {
      const historyBefore = await page.evaluate(() => history.length);
      await page.getByRole("button", { name: "Share My Progress" }).click();
      const tops = await sampleDialog(page, 1000);
      const mounts = await page.evaluate(() => window.__mounts);
      assert.ok(tops.length > 10, `round ${round}: dialog never rendered`);
      assert.equal(mounts.sheet, round, `round ${round}: dialog mounted ${mounts.sheet - round + 1} times`);
      assert.equal(mounts.body, 0, `round ${round}: page body remounted ${mounts.body} times`);
      const settled = tops.at(-1);
      assert.ok(Math.abs(settled.mid - viewport.height / 2) <= 4, `round ${round}: dialog not centered (mid ${settled.mid})`);
      const spread = Math.max(...tops.map((t) => t.top)) - Math.min(...tops.map((t) => t.top));
      assert.ok(spread <= 12, `round ${round}: dialog moved ${spread}px`);
      const growth = (await page.evaluate(() => history.length)) - historyBefore;
      assert.ok(growth <= 1, `round ${round}: history grew by ${growth}`);
      const url = page.url();
      if (round % 2) await page.goBack();
      else await page.getByRole("button", { name: "Close sheet" }).click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator(".sheet").count(), 0, `round ${round}: dialog still open after close`);
      assert.equal(page.url(), url, `round ${round}: close navigated away`);
    }
  } finally {
    await ctx.close();
  }
});

await check("mobile Message Presets: one mount, page not remounted, Back closes on same page", async () => {
  const { ctx, page } = await openPage({ width: 390, height: 844 }, "/challenge/reach");
  try {
    const url = page.url();
    await page.locator(".challenge-message-preset").click();
    await page.waitForTimeout(800);
    const mounts = await page.evaluate(() => window.__mounts);
    assert.equal(mounts.sheet, 1, `sheet mounted ${mounts.sheet} times`);
    assert.equal(mounts.body, 0, `page body remounted ${mounts.body} times`);
    await page.goBack();
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".sheet").count(), 0, "sheet still open after Back");
    assert.equal(page.url(), url, "Back left the page");
  } finally {
    await ctx.close();
  }
});

await check("Challenge tabs: switching Reach/Share/Bring does not remount or re-animate the page", async () => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const { ctx, page } = await openPage(viewport, "/challenge/reach");
    try {
      for (const tab of ["Share 10", "Bring 10", "Reach 10"]) {
        await page.getByRole("tab", { name: tab }).click();
        await page.waitForTimeout(60);
        const running = await page.evaluate(() =>
          document.querySelector(".screen__body")?.getAnimations().filter((a) => a.playState === "running").length ?? 0);
        assert.equal(running, 0, `${viewport.width}px ${tab}: page entrance animation replayed`);
        await page.waitForTimeout(250);
      }
      const mounts = await page.evaluate(() => window.__mounts);
      assert.equal(mounts.body, 0, `${viewport.width}px: page body remounted ${mounts.body} times`);
      assert.equal(await page.getByRole("tab", { selected: true }).textContent(), "Reach 10");
    } finally {
      await ctx.close();
    }
  }
});

await check("Election Day banner follows the local calendar date, not UTC", async () => {
  // 23:30 on Nov 3 in Los Angeles is already Nov 4 in UTC; 20:00 on Nov 2 is already Nov 3 in UTC.
  for (const [iso, expected] of [["2026-11-04T07:30:00Z", true], ["2026-11-03T04:00:00Z", false]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "America/Los_Angeles" });
    try {
      const page = await ctx.newPage();
      await page.clock.setFixedTime(new Date(iso));
      await page.goto(BASE + "/?app=1", { waitUntil: "networkidle" });
      const shown = await page.getByText("Today's the day.").count() > 0;
      assert.equal(shown, expected, `${iso} in Los Angeles: banner ${shown ? "shown" : "hidden"}`);
    } finally {
      await ctx.close();
    }
  }
});

await browser.close();
if (failures.length) {
  console.log(`\n${failures.length} overlay stability check(s) failed against ${BASE}`);
  process.exit(1);
}
console.log(`\noverlay stability OK against ${BASE}`);
