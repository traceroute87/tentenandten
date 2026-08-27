// One-off rasterizer: assets/icon-master.svg -> /public PWA icons.
// Run: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const src = "assets/icon-master.svg";
await mkdir("public/icons", { recursive: true });

const jobs = [
  { out: "public/icons/icon-192.png", size: 192 },
  { out: "public/icons/icon-512.png", size: 512 },
  { out: "public/icons/icon-maskable-512.png", size: 512, pad: 52, bg: "#0b1220" },
  { out: "public/apple-touch-icon.png", size: 180 },
];

for (const j of jobs) {
  let img = sharp(src).resize(j.size, j.size);
  if (j.pad) {
    const inner = j.size - j.pad * 2;
    img = sharp(src)
      .resize(inner, inner)
      .extend({ top: j.pad, bottom: j.pad, left: j.pad, right: j.pad, background: j.bg })
      .flatten({ background: j.bg });
  }
  await img.png().toFile(j.out);
  console.log("wrote", j.out);
}
