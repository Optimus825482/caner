/**
 * Optimize all images in public/uploads to WebP format.
 * Run: npx tsx scripts/optimize-images.ts
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");
const QUALITY = 82;
const MAX_WIDTH = 1600;

async function optimizeDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await optimizeDir(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;

    const webpPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, ".webp");

    // Skip if WebP already exists and is newer
    if (fs.existsSync(webpPath)) {
      const srcStat = fs.statSync(fullPath);
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs >= srcStat.mtimeMs) {
        console.log(`  SKIP ${path.relative(UPLOADS_DIR, webpPath)}`);
        continue;
      }
    }

    try {
      const img = sharp(fullPath);
      const meta = await img.metadata();
      const pipeline =
        meta.width && meta.width > MAX_WIDTH ? img.resize(MAX_WIDTH) : img;

      await pipeline.webp({ quality: QUALITY }).toFile(webpPath);

      const origSize = fs.statSync(fullPath).size;
      const newSize = fs.statSync(webpPath).size;
      const saved = ((1 - newSize / origSize) * 100).toFixed(1);

      console.log(
        `  ✓ ${path.relative(UPLOADS_DIR, webpPath)} (${saved}% smaller)`,
      );
    } catch (err) {
      console.error(`  ✗ ${entry.name}: ${err}`);
    }
  }
}

async function main() {
  console.log("Optimizing images in public/uploads...\n");
  await optimizeDir(UPLOADS_DIR);
  console.log("\nDone!");
}

main();
