// Visual QA screenshots via Playwright. Assumes `npm run preview` on :4173.
// Usage: node scripts/qa-shots.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.QA_BASE || "http://localhost:4173";
const OUT = "qa";
await mkdir(OUT, { recursive: true });

const viewports = {
  iphone: { width: 390, height: 844, dsf: 3, mobile: true },
  android: { width: 393, height: 873, dsf: 2.75, mobile: true },
  tablet: { width: 834, height: 1112, dsf: 2, mobile: true },
  desktop1280: { width: 1280, height: 720, dsf: 1, mobile: false },
  desktop1440: { width: 1440, height: 900, dsf: 1, mobile: false },
};

// [name, path, viewport-keys, fullPage]
const shots = [
  ["landing", "/welcome", ["desktop1280", "desktop1440", "tablet"], true],
  ["landing-fold", "/welcome", ["desktop1280", "desktop1440"], false],
  ["home", "/?app=1", ["iphone", "android", "tablet"], true],
  ["home-fold", "/?app=1", ["iphone"], false],
  ["home", "/?app=1", ["desktop1280", "desktop1440"], true],
  ["challenge-reach", "/challenge/reach", ["iphone", "desktop1280", "desktop1440"], true],
  ["challenge-share", "/challenge/share", ["iphone", "desktop1280", "desktop1440"], true],
  ["challenge-bring", "/challenge/bring", ["iphone", "desktop1280", "desktop1440"], true],
  ["voting", "/voting", ["iphone", "desktop1280"], true],
  ["voting-firsttime", "/voting/first-time", ["iphone"], false],
  ["help", "/help", ["iphone", "desktop1280"], true],
  ["help-detail", "/help/where", ["iphone"], true],
  ["impact", "/impact", ["iphone", "desktop1280"], true],
  ["today", "/today", ["iphone"], true],
];

const browser = await chromium.launch();
for (const [name, path, vps, fullPage] of shots) {
  for (const vk of vps) {
    const v = viewports[vk];
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: v.dsf,
      isMobile: v.mobile,
      hasTouch: v.mobile,
      reducedMotion: "reduce",
      serviceWorkers: "block",
      bypassCSP: true,
    });
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const file = `${OUT}/${name}__${vk}.png`;
    await page.screenshot({ path: file, fullPage });
    console.log(file);
    await ctx.close();
  }
}

// menu sheet open (iphone)
{
  const v = viewports.iphone;
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.dsf,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/?app=1", { waitUntil: "networkidle" });
  await page.getByLabel("Menu").last().click(); // last = mobile TopBar (DeskNav one is display:none)
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/menu__iphone.png` });
  console.log(`${OUT}/menu__iphone.png`);
  await ctx.close();
}

await browser.close();
console.log("done");
