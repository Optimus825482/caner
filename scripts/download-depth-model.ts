/**
 * Download Depth Anything V2 Small ONNX model from Hugging Face.
 * Run: npx tsx scripts/download-depth-model.ts
 *
 * Downloads: onnx-community/depth-anything-v2-small → models/depth-anything-v2-small.onnx
 * Size: ~50MB
 */
import fs from "fs";
import path from "path";
import https from "https";

const MODEL_URL =
  "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx";
const MODELS_DIR = path.join(process.cwd(), "models");
const MODEL_PATH = path.join(MODELS_DIR, "depth-anything-v2-small.onnx");

function followRedirects(
  url: string,
  dest: fs.WriteStream,
  maxRedirects = 5,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error("Too many redirects"));
      return;
    }

    https
      .get(url, (res) => {
        // Follow redirects (HF CDN uses 302)
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume(); // consume response to free memory
          followRedirects(res.headers.location, dest, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const totalBytes = parseInt(res.headers["content-length"] || "0", 10);
        let downloaded = 0;
        let lastPercent = -1;

        res.on("data", (chunk: Buffer) => {
          downloaded += chunk.length;
          if (totalBytes > 0) {
            const percent = Math.floor((downloaded / totalBytes) * 100);
            if (percent !== lastPercent && percent % 10 === 0) {
              lastPercent = percent;
              const mb = (downloaded / 1024 / 1024).toFixed(1);
              const totalMb = (totalBytes / 1024 / 1024).toFixed(1);
              process.stdout.write(
                `\r  Downloading... ${mb}MB / ${totalMb}MB (${percent}%)`,
              );
            }
          }
        });

        res.pipe(dest);

        dest.on("finish", () => {
          dest.close();
          console.log("\n  ✓ Download complete");
          resolve();
        });

        res.on("error", reject);
        dest.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("Depth Anything V2 Small — ONNX Model Download\n");

  // Check if already exists
  if (fs.existsSync(MODEL_PATH)) {
    const stat = fs.statSync(MODEL_PATH);
    const mb = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`  Model already exists: ${MODEL_PATH} (${mb}MB)`);
    console.log("  Delete the file to re-download.");
    return;
  }

  // Create models directory
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`  Created directory: ${MODELS_DIR}`);
  }

  console.log(`  Source: onnx-community/depth-anything-v2-small`);
  console.log(`  Target: ${MODEL_PATH}\n`);

  const dest = fs.createWriteStream(MODEL_PATH);

  try {
    await followRedirects(MODEL_URL, dest);
    const stat = fs.statSync(MODEL_PATH);
    const mb = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`  File size: ${mb}MB`);
    console.log("\nDone! Model is ready for depth map generation.");
  } catch (err) {
    // Clean up partial download
    dest.close();
    if (fs.existsSync(MODEL_PATH)) {
      fs.unlinkSync(MODEL_PATH);
    }
    console.error(`\n  ✗ Download failed: ${err}`);
    process.exit(1);
  }
}

main();
