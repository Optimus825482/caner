import sharp from "sharp";
import path from "path";

const pub = path.join(process.cwd(), "public");
const src = path.join(pub, "logo.png");
const bg = { r: 7, g: 13, b: 26, alpha: 1 };

async function generate() {
  const sizes = [48, 72, 96, 128, 192, 256, 384, 512];
  for (const s of sizes) {
    await sharp(src)
      .resize(s, s, { fit: "contain", background: bg })
      .png()
      .toFile(path.join(pub, `icon-${s}.png`));
    console.log(`icon-${s}.png`);
  }

  // apple-touch-icon 180x180
  await sharp(src)
    .resize(180, 180, { fit: "contain", background: bg })
    .png()
    .toFile(path.join(pub, "apple-touch-icon.png"));
  console.log("apple-touch-icon.png");

  // maskable icon with safe zone padding
  await sharp(src)
    .resize(384, 384, { fit: "contain", background: bg })
    .extend({ top: 64, bottom: 64, left: 64, right: 64, background: bg })
    .png()
    .toFile(path.join(pub, "icon-maskable-512.png"));
  console.log("icon-maskable-512.png");

  console.log("Done!");
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
