import path from "path";
import type { InferenceSession } from "onnxruntime-node";

let cachedSession: InferenceSession | null = null;

async function getOrCreateSession(): Promise<InferenceSession> {
  if (cachedSession) return cachedSession;

  const ort = await import("onnxruntime-node");
  const modelPath = path.join(
    process.cwd(),
    "models",
    "depth-anything-v2-small.onnx",
  );

  try {
    cachedSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
    });
  } catch (err) {
    throw new Error(
      `Depth model not available: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return cachedSession;
}

export async function generateDepthMap(imagePath: string): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
}> {
  const sharp = (await import("sharp")).default;

  // 1. Load image and get metadata
  let meta;
  try {
    meta = await sharp(imagePath).metadata();
  } catch (err) {
    throw new Error(
      `Invalid or corrupt image: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!meta.width || !meta.height) {
    throw new Error("Invalid or corrupt image: missing dimensions");
  }

  const origW = meta.width;
  const origH = meta.height;

  // 2. Resize if exceeds 2048x2048 (preserve aspect ratio)
  const maxDim = 2048;
  let pipeline = sharp(imagePath);
  if (origW > maxDim || origH > maxDim) {
    pipeline = pipeline.resize(maxDim, maxDim, { fit: "inside" });
  }

  // 3. Resize to 518x518 model input, extract raw RGB
  const MODEL_INPUT_SIZE = 518;
  const { data } = await pipeline
    .resize(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 4. Normalize to float32 CHW format with ImageNet mean/std
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const pixels = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const float32 = new Float32Array(3 * pixels);

  for (let i = 0; i < pixels; i++) {
    for (let c = 0; c < 3; c++) {
      float32[c * pixels + i] = (data[i * 3 + c] / 255 - mean[c]) / std[c];
    }
  }

  // 5. Run ONNX inference
  const ort = await import("onnxruntime-node");
  const session = await getOrCreateSession();
  const inputTensor = new ort.Tensor("float32", float32, [
    1,
    3,
    MODEL_INPUT_SIZE,
    MODEL_INPUT_SIZE,
  ]);
  const results = await session.run({ pixel_values: inputTensor });
  const depthData = results["predicted_depth"].data as Float32Array;

  // 6. Normalize depth values to [0, 255]
  let min = Infinity,
    max = -Infinity;
  for (const v of depthData) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const range = max - min || 1;
  const uint8 = new Uint8Array(depthData.length);
  for (let i = 0; i < depthData.length; i++) {
    uint8[i] = Math.round(((depthData[i] - min) / range) * 255);
  }

  // 7. Resize back to original dimensions, output as grayscale PNG
  const depthBuffer = await sharp(Buffer.from(uint8.buffer), {
    raw: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE, channels: 1 },
  })
    .resize(origW, origH, { kernel: "lanczos3" })
    .png({ compressionLevel: 6 })
    .toBuffer();

  return { buffer: depthBuffer, width: origW, height: origH };
}
