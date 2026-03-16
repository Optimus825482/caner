import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
/** Soft limit: files above this are auto-compressed instead of rejected */
export const UPLOAD_SOFT_LIMIT_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_WIDTH = 4096;
export const MAX_IMAGE_HEIGHT = 4096;
export const MAX_IMAGE_PIXELS = 16_000_000;

/**
 * Progressively compress an image buffer until it fits under targetBytes.
 * Strategy: first reduce quality, then resize if still too large.
 * Returns the compressed buffer + metadata about what was done.
 */
export async function compressToFit(
  buffer: Buffer,
  ext: SupportedExt,
  targetBytes: number = MAX_FILE_SIZE_BYTES,
): Promise<{
  buffer: Buffer;
  ext: SupportedExt;
  wasCompressed: boolean;
  finalQuality?: number;
  wasResized?: boolean;
}> {
  if (buffer.length <= targetBytes) {
    return { buffer, ext, wasCompressed: false };
  }

  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;

  // Phase 1: Quality reduction (only for lossy formats)
  const qualitySteps =
    ext === ".png"
      ? [
          { q: 90, fmt: "webp" as const },
          { q: 80, fmt: "webp" as const },
          { q: 70, fmt: "webp" as const },
          { q: 60, fmt: "webp" as const },
        ]
      : [85, 75, 65, 55, 45].map((q) => ({
          q,
          fmt: ext === ".webp" ? ("webp" as const) : ("jpg" as const),
        }));

  let currentExt = ext;

  for (const step of qualitySteps) {
    let pipeline = sharp(buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).autoOrient();

    if (step.fmt === "webp") {
      pipeline = pipeline.webp({ quality: step.q });
      currentExt = ".webp";
    } else {
      pipeline = pipeline.jpeg({ quality: step.q, mozjpeg: true });
      currentExt = ".jpg";
    }

    const result = await pipeline.toBuffer();
    if (result.length <= targetBytes) {
      return {
        buffer: result,
        ext: currentExt,
        wasCompressed: true,
        finalQuality: step.q,
      };
    }
  }

  // Phase 2: Resize progressively (80%, 60%, 50% of original dimensions)
  const meta = await sharp(buffer, {
    limitInputPixels: MAX_IMAGE_PIXELS,
  }).metadata();
  const origW = meta.width ?? MAX_IMAGE_WIDTH;
  const scaleSteps = [0.8, 0.6, 0.5];

  for (const scale of scaleSteps) {
    const newW = Math.round(origW * scale);
    let pipeline = sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
      .autoOrient()
      .resize(newW, undefined, { withoutEnlargement: true });

    if (currentExt === ".webp" || ext === ".png") {
      pipeline = pipeline.webp({ quality: 75 });
      currentExt = ".webp";
    } else {
      pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
      currentExt = ".jpg";
    }

    const result = await pipeline.toBuffer();
    if (result.length <= targetBytes) {
      return {
        buffer: result,
        ext: currentExt,
        wasCompressed: true,
        finalQuality: 75,
        wasResized: true,
      };
    }
  }

  // Last resort: aggressive resize + low quality
  const lastResort = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
    .autoOrient()
    .resize(1920, undefined, { withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer();

  return {
    buffer: lastResort,
    ext: ".webp",
    wasCompressed: true,
    finalQuality: 60,
    wasResized: true,
  };
}

export const ALLOWED_FILE_TYPES: Record<
  string,
  { mimes: string[]; outputExt: ".jpg" | ".png" | ".webp" }
> = {
  ".jpg": { mimes: ["image/jpeg"], outputExt: ".jpg" },
  ".jpeg": { mimes: ["image/jpeg"], outputExt: ".jpg" },
  ".png": { mimes: ["image/png"], outputExt: ".png" },
  ".webp": { mimes: ["image/webp"], outputExt: ".webp" },
};

export const SNIFFED_TYPE_MIME: Record<".jpg" | ".png" | ".webp", string[]> = {
  ".jpg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
};

export type SupportedExt = ".jpg" | ".png" | ".webp";

const TEMP_DIR_CACHE_TTL_MS = 5_000;
let tempDirEntriesCache: { entries: string[]; expiresAt: number } | null = null;

export function getSafeExt(originalName: string): string | null {
  const ext = path.extname(originalName || "").toLowerCase();
  return ALLOWED_FILE_TYPES[ext] ? ext : null;
}

export function sniffImageType(buffer: Buffer): SupportedExt | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return ".jpg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return ".png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }

  return null;
}

export function getTempMediaDir() {
  return path.join(process.cwd(), "storage", "tmp-media");
}

export function getPublicUploadDir() {
  return path.join(process.cwd(), "public", "uploads", "products");
}

export async function ensureMediaDirs() {
  await mkdir(getTempMediaDir(), { recursive: true });
  await mkdir(getPublicUploadDir(), { recursive: true });
}

export async function saveTempMedia(buffer: Buffer, ext: SupportedExt) {
  await ensureMediaDirs();
  const tempId = randomUUID();
  const filename = `${tempId}${ext}`;
  const filePath = path.join(getTempMediaDir(), filename);
  await writeFile(filePath, buffer, { flag: "wx" });
  tempDirEntriesCache = null;
  return { tempId, filename, filePath };
}

async function getTempDirEntriesCached() {
  const now = Date.now();

  if (tempDirEntriesCache && tempDirEntriesCache.expiresAt > now) {
    return tempDirEntriesCache.entries;
  }

  const entries = await readdir(getTempMediaDir()).catch(() => [] as string[]);
  tempDirEntriesCache = {
    entries,
    expiresAt: now + TEMP_DIR_CACHE_TTL_MS,
  };

  return entries;
}

export async function resolveTempFileById(tempId: string) {
  const dir = getTempMediaDir();
  const entries = await getTempDirEntriesCached();
  const found = entries.find((name) =>
    [".jpg", ".png", ".webp"].some((ext) => name === `${tempId}${ext}`),
  );
  if (!found) return null;

  const ext = path.extname(found).toLowerCase() as SupportedExt;
  return {
    filename: found,
    filePath: path.join(dir, found),
    ext,
  };
}

export async function cleanupOldTempMedia(maxAgeHours = 24) {
  const dir = getTempMediaDir();
  const entries = await readdir(dir).catch(() => [] as string[]);
  if (entries.length === 0) return;

  const threshold = Date.now() - maxAgeHours * 60 * 60 * 1000;
  let deletedAny = false;

  await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(dir, name);
      try {
        const meta = await stat(fullPath);
        if (meta.mtimeMs < threshold) {
          await unlink(fullPath);
          deletedAny = true;
        }
      } catch {
        // noop
      }
    }),
  );

  if (deletedAny) {
    tempDirEntriesCache = null;
  }
}
