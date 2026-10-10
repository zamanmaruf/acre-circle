// Generates brand assets from the source logo.
// Usage: node scripts/brand.mjs <path-to-source-logo.png>
import sharp from "sharp";
import { copyFileSync, mkdirSync } from "node:fs";

const src = process.argv[2];
if (!src) throw new Error("Pass the source logo path");
mkdirSync("public/brand", { recursive: true });
copyFileSync(src, "public/brand/acre-circle-logo.png");

// Emblem region of the 1024×1024 source (excludes wordmark and tagline).
const crop = { left: 300, top: 150, width: 424, height: 424 };
const { data, info } = await sharp(src).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// Fade the off-white background to transparent, keeping anti-aliased edges soft.
const bg = [data[0], data[1], data[2]];
for (let i = 0; i < data.length; i += 4) {
  const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
  data[i + 3] = Math.round(Math.max(0, Math.min(1, (d - 10) / 40)) * 255);
}
const mark = sharp(data, { raw: info }).png();
await mark.clone().trim().resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile("public/brand/acre-circle-mark.png");

// App icons: emblem centred on the brand cream.
const markBuf = await mark.clone().trim().resize(400, 400, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
const cream = { r: 254, g: 253, b: 249, alpha: 1 };
await sharp({ create: { width: 512, height: 512, channels: 4, background: cream } })
  .composite([{ input: markBuf, gravity: "center" }])
  .png()
  .toFile("src/app/icon.png");
await sharp({ create: { width: 180, height: 180, channels: 4, background: cream } })
  .composite([{ input: await sharp(markBuf).resize(140, 140).toBuffer(), gravity: "center" }])
  .png()
  .toFile("src/app/apple-icon.png");
console.log("brand assets written");
