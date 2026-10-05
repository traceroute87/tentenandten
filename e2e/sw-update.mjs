// Service-worker deploy transition: maintenance build -> normal build on one origin.
// Builds both variants, serves them with Cloudflare-like cache headers, and checks that
// a page controlled by the old worker reloads once into the new build, with no loop.
// Usage: npm run test:sw
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import assert from "node:assert/strict";

const dir = await mkdtemp(join(tmpdir(), "t10-sw-"));
const build = (out, maintenance) => execSync(`npx vite build --outDir "${out}" --emptyOutDir`, {
  stdio: "ignore",
  env: { ...process.env, VITE_MAINTENANCE_MODE: maintenance ? "true" : "false" },
});
build(join(dir, "maintenance"), true);
build(join(dir, "normal"), false);

let root = join(dir, "maintenance");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg", ".avif": "image/avif", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  let path = new URL(req.url, "http://x").pathname;
  if (path === "/") path = "/index.html";
  let body;
  try { body = await readFile(join(root, path)); } catch { path = "/index.html"; body = await readFile(join(root, path)); }
  res.writeHead(200, {
    "content-type": types[extname(path)] ?? "application/octet-stream",
    "cache-control": path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
  });
  res.end(body);
}).listen(0);
const url = `http://localhost:${server.address().port}/?app=1`;

const browser = await chromium.launch();
let failed = false;
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  let loads = 0;
  page.on("load", () => loads++);
  const view = () => page.evaluate(() => document.body.innerText.includes("making a few improvements") ? "maintenance" : document.querySelector(".screen__body") ? "app" : "other");

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
  assert.equal(loads, 1, `first install reloaded the page (${loads} loads)`);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await view(), "maintenance");

  root = join(dir, "normal"); // deploy
  loads = 0;
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector(".screen__body"), null, { timeout: 15000 })
    .catch(() => { throw new Error(`first open after deploy stayed on: ${loads} loads`); });
  await page.waitForTimeout(3000);
  assert.equal(await view(), "app");
  assert.ok(loads <= 2, `reload loop: ${loads} loads after one reopen`);

  loads = 0;
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  assert.equal(await view(), "app");
  assert.equal(loads, 1, `extra reload with no new deploy (${loads} loads)`);
  console.log("ok   maintenance -> normal: first open after deploy runs the new build, one reload, no loop");
} catch (error) {
  failed = true;
  console.log(`FAIL service-worker deploy transition\n     ${String(error.message).split("\n")[0]}`);
} finally {
  await browser.close();
  server.close();
  await rm(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
