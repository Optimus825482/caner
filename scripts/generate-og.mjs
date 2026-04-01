import sharp from "sharp";
import { readFileSync, statSync } from "fs";
import { join } from "path";

const W = 1200;
const H = 630;
const logoPath = join("public", "logo.png");
const outputPath = join("public", "image.png");
const logoSize = 300;

const logoResized = await sharp(logoPath)
  .resize(logoSize, logoSize, {
    fit: "inside",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();

const logoMeta = await sharp(logoResized).metadata();
const lw = logoMeta.width;
const lh = logoMeta.height;

const logoLeft = Math.round((W - lw) / 2);
const logoTop = Math.round((H - lh) / 2) - 40;

const textY1 = logoTop + lh + 58;
const textY2 = logoTop + lh + 98;
const lineY = logoTop + lh + 112;
const lineX = W / 2 - 60;

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="38%">
      <stop offset="0%" stop-color="#c4a15a" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#050c19" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#050c19"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="${W / 2}" y="${textY1}"
    font-family="Georgia, serif" font-size="52" font-weight="700"
    fill="#e8d5a3" text-anchor="middle" letter-spacing="6">ARVESTA</text>
  <text x="${W / 2}" y="${textY2}"
    font-family="Georgia, serif" font-size="21" font-weight="400"
    fill="#c4a15a" text-anchor="middle" letter-spacing="3" font-style="italic">Menuiserie France</text>
  <rect x="${lineX}" y="${lineY}" width="120" height="1.5" fill="#c4a15a" opacity="0.7"/>
  <text x="${W - 36}" y="${H - 28}"
    font-family="Georgia, serif" font-size="15"
    fill="#c4a15a" text-anchor="end" opacity="0.55">arvestafrance.com</text>
</svg>`;

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: { r: 5, g: 12, b: 25, alpha: 255 },
  },
})
  .composite([
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: logoResized, top: logoTop, left: logoLeft },
  ])
  .png({ compressionLevel: 8 })
  .toFile(outputPath);

const stat = statSync(outputPath);
console.log(`Generated ${outputPath} — ${Math.round(stat.size / 1024)} KB`);
