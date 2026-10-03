// Rasterize the supplied app icon -> /public PWA icons.
// Run: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const src = "assets/app-icon-source.png";
const bg = "#0b1220";
await mkdir("public/icons", { recursive: true });

const jobs = [
  { out: "public/icons/icon-192.png", size: 192, pad: 0 },
  { out: "public/icons/icon-512.png", size: 512, pad: 0 },
  { out: "public/icons/icon-maskable-512.png", size: 512, pad: 52 },
  { out: "public/apple-touch-icon.png", size: 180, pad: 0 },
];

for (const j of jobs) {
  const pad = j.pad;
  const inner = j.size - pad * 2;
  await sharp(src)
    .resize(inner, inner)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: bg })
    .flatten({ background: bg })
    .png()
    .toFile(j.out);
  console.log("wrote", j.out);
}
