// Optimize the Capitol hero from assets/capitol-source.jpg into responsive
// avif/webp/jpg at two widths. Output -> public/hero/. Run: npm run hero
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const src = "assets/capitol-source.jpg";
await mkdir("public/hero", { recursive: true });

// 960 = app card + tablet; 1600 = full-bleed desktop hero (covers 1440 + retina-ish)
const widths = [960, 1600];

for (const w of widths) {
  const base = sharp(src).resize({ width: w, withoutEnlargement: true });
  await base.clone().avif({ quality: 50 }).toFile(`public/hero/capitol-${w}.avif`);
  await base.clone().webp({ quality: 72 }).toFile(`public/hero/capitol-${w}.webp`);
  await base.clone().jpeg({ quality: 74, mozjpeg: true }).toFile(`public/hero/capitol-${w}.jpg`);
}

// tiny blurred LQIP for instant paint
await sharp(src)
  .resize({ width: 24 })
  .blur()
  .webp({ quality: 30 })
  .toFile("public/hero/capitol-lqip.webp");

console.log("hero assets written to public/hero/");
