import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import {
  buildClientKey,
  createSiteSettingRateLimitAdapter,
  enforceRateLimit,
  enforceSameOrigin,
} from "@/lib/request-guards";
import { prisma } from "@/lib/prisma";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_IMAGE_WIDTH = 4096;
const MAX_IMAGE_HEIGHT = 4096;
const MAX_IMAGE_PIXELS = 16_000_000;
const FORCE_IMAGE_REENCODE = process.env.UPLOAD_FORCE_REENCODE !== "false";
const TINYPNG_API_KEY = process.env.TINYPNG_API_KEY?.trim();
const TINYPNG_ENABLED = process.env.UPLOAD_ENABLE_TINYPNG === "true";

const execFileAsync = promisify(execFile);

const ALLOWED_FILE_TYPES: Record<
  string,
  { mimes: string[]; outputExt: ".jpg" | ".png" | ".webp" }
> = {
  ".jpg": { mimes: ["image/jpeg"], outputExt: ".jpg" },
  ".jpeg": { mimes: ["image/jpeg"], outputExt: ".jpg" },
  ".png": { mimes: ["image/png"], outputExt: ".png" },
  ".webp": { mimes: ["image/webp"], outputExt: ".webp" },
};

const SNIFFED_TYPE_MIME: Record<".jpg" | ".png" | ".webp", string[]> = {
  ".jpg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
};

const uploadFormSchema = z.object({
  file: z.instanceof(File),
});

const uploadRateLimitAdapter = createSiteSettingRateLimitAdapter(prisma.siteSetting);

function getSafeExt(originalName: string): string | null {
  const ext = path.extname(originalName || "").toLowerCase();
  return ALLOWED_FILE_TYPES[ext] ? ext : null;
}


function sniffImageType(buffer: Buffer): ".jpg" | ".png" | ".webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
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

function getNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

async function compressWithTinyPng(filePath: string, ext: ".jpg" | ".png" | ".webp") {
  if (!TINYPNG_ENABLED || !TINYPNG_API_KEY) return;

  // tinypng-cli stable olarak JPG/PNG için çalışıyor; WEBP desteği garanti değil.
  if (ext === ".webp") return;

  await execFileAsync(getNpxCommand(), [
    "--yes",
    "tinypng-cli",
    filePath,
    "-k",
    TINYPNG_API_KEY,
  ]);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const clientKey = buildClientKey(req, "upload");
  const rateLimited = await enforceRateLimit({
    adapter: uploadRateLimitAdapter,
    keyPrefix: "upload_rl",
    clientKey,
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    errorMessage: "Too many upload requests. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  const formData = await req.formData();

  const parsed = uploadFormSchema.safeParse({ file: formData.get("file") });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid form data",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const uploaded = parsed.data.file;

  if (uploaded.size === 0) {
    return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
  }

  if (uploaded.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File too large. Max allowed size is ${Math.floor(
          MAX_FILE_SIZE_BYTES / (1024 * 1024),
        )}MB`,
      },
      { status: 413 },
    );
  }

  const safeExt = getSafeExt(uploaded.name);
  if (!safeExt) {
    return NextResponse.json(
      {
        error: "Unsupported file extension. Allowed: .jpg, .jpeg, .png, .webp",
      },
      { status: 415 },
    );
  }

  const bytes = await uploaded.arrayBuffer();
  const rawBuffer = Buffer.from(bytes);

  const sniffedExt = sniffImageType(rawBuffer);
  if (!sniffedExt) {
    return NextResponse.json(
      {
        error: "Invalid image content. Magic-byte signature is not supported.",
      },
      { status: 415 },
    );
  }

  const expectedOutputExt = ALLOWED_FILE_TYPES[safeExt].outputExt;
  if (sniffedExt !== expectedOutputExt) {
    return NextResponse.json(
      {
        error: `File extension/content mismatch. Expected ${expectedOutputExt} content.`,
      },
      { status: 415 },
    );
  }

  const sniffedMimes = SNIFFED_TYPE_MIME[sniffedExt];
  if (uploaded.type && !sniffedMimes.includes(uploaded.type)) {
    return NextResponse.json(
      {
        error: `MIME type mismatch for detected file type ${sniffedExt}. Received: ${uploaded.type}`,
      },
      { status: 415 },
    );
  }

  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;

  const metadata = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    return NextResponse.json(
      { error: "Could not determine image dimensions" },
      { status: 400 },
    );
  }

  if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
    return NextResponse.json(
      {
        error: `Image dimensions exceed limit. Max ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px`,
      },
      { status: 413 },
    );
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    return NextResponse.json(
      {
        error: `Image pixel count exceeds limit. Max ${MAX_IMAGE_PIXELS} pixels`,
      },
      { status: 413 },
    );
  }

  let finalBuffer: Buffer<ArrayBufferLike> = rawBuffer;
  let finalExt: ".jpg" | ".png" | ".webp" = sniffedExt;

  if (FORCE_IMAGE_REENCODE) {
    if (sniffedExt === ".jpg") {
      finalBuffer = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
        .rotate()
        .jpeg({ quality: 85 })
        .toBuffer();
      finalExt = ".jpg";
    } else if (sniffedExt === ".png") {
      finalBuffer = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
        .rotate()
        .png({ compressionLevel: 9 })
        .toBuffer();
      finalExt = ".png";
    } else if (sniffedExt === ".webp") {
      finalBuffer = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
        .rotate()
        .webp({ quality: 85 })
        .toBuffer();
      finalExt = ".webp";
    }
  }

  const filename = `${Date.now()}-${randomUUID()}${finalExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, finalBuffer, { flag: "wx" });

  let tinyPngApplied = false;
  if (TINYPNG_ENABLED && TINYPNG_API_KEY) {
    try {
      await compressWithTinyPng(filePath, finalExt);
      tinyPngApplied = finalExt !== ".webp";
    } catch (error) {
      console.error("TinyPNG compression failed, serving Sharp-compressed image instead:", error);
    }
  }

  const url = `/uploads/products/${filename}`;

  return NextResponse.json({ url, filename, tinyPngApplied });
}
