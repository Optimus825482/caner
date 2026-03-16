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
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_WIDTH,
  SNIFFED_TYPE_MIME,
  UPLOAD_SOFT_LIMIT_BYTES,
  cleanupOldTempMedia,
  compressToFit,
  getSafeExt,
  saveTempMedia,
  sniffImageType,
  type SupportedExt,
} from "@/lib/media-preprocess";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const FORCE_IMAGE_REENCODE = process.env.UPLOAD_FORCE_REENCODE !== "false";

const uploadFormSchema = z.object({
  file: z.instanceof(File),
});

const uploadRateLimitAdapter = createSiteSettingRateLimitAdapter(
  prisma.siteSetting,
);

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
    return NextResponse.json(
      { error: "Uploaded file is empty" },
      { status: 400 },
    );
  }

  if (uploaded.size > UPLOAD_SOFT_LIMIT_BYTES) {
    return NextResponse.json(
      {
        error: `File too large. Max allowed size is ${Math.floor(UPLOAD_SOFT_LIMIT_BYTES / (1024 * 1024))}MB`,
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

  const metadata = await sharp(rawBuffer, {
    limitInputPixels: MAX_IMAGE_PIXELS,
  }).metadata();
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
  let finalExt: SupportedExt = sniffedExt;

  if (FORCE_IMAGE_REENCODE) {
    if (sniffedExt === ".jpg") {
      finalBuffer = await sharp(rawBuffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .autoOrient()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      finalExt = ".jpg";
    } else if (sniffedExt === ".png") {
      finalBuffer = await sharp(rawBuffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .autoOrient()
        .png({ compressionLevel: 9 })
        .toBuffer();
      finalExt = ".png";
    } else {
      finalBuffer = await sharp(rawBuffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .autoOrient()
        .webp({ quality: 90 })
        .toBuffer();
      finalExt = ".webp";
    }
  }

  // Auto-compress if still over 5MB after re-encode
  if (finalBuffer.length > MAX_FILE_SIZE_BYTES) {
    const compressed = await compressToFit(
      finalBuffer,
      finalExt,
      MAX_FILE_SIZE_BYTES,
    );
    finalBuffer = compressed.buffer;
    finalExt = compressed.ext;
  }

  const saved = await saveTempMedia(finalBuffer, finalExt);
  void cleanupOldTempMedia(24);

  return NextResponse.json({
    tempId: saved.tempId,
    previewUrl: `/api/media/temp/${saved.tempId}`,
    width,
    height,
    format: finalExt,
    requiresPreprocess: true,
  });
}
