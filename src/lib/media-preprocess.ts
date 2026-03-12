import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_WIDTH = 4096;
export const MAX_IMAGE_HEIGHT = 4096;
export const MAX_IMAGE_PIXELS = 16_000_000;

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
  return { tempId, filename, filePath };
}

export async function resolveTempFileById(tempId: string) {
  const dir = getTempMediaDir();
  const entries = await readdir(dir).catch(() => [] as string[]);
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

  await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(dir, name);
      try {
        const meta = await stat(fullPath);
        if (meta.mtimeMs < threshold) {
          await unlink(fullPath);
        }
      } catch {
        // noop
      }
    }),
  );
}
