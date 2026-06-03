import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_WIDTH,
  SNIFFED_TYPE_MIME,
  getSafeExt,
  sniffImageType,
  type SupportedExt,
} from "@/lib/media-preprocess";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 413 },
      );
    }

    const safeExt = getSafeExt(file.name);
    if (!safeExt) {
      return NextResponse.json(
        {
          error: "Unsupported file extension. Allowed: .jpg, .jpeg, .png, .webp",
        },
        { status: 415 },
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const sniffedExt = sniffImageType(rawBuffer);
    if (!sniffedExt) {
      return NextResponse.json(
        { error: "Invalid image content. Magic-byte signature is not supported." },
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
    if (file.type && !sniffedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `MIME type mismatch for detected file type ${sniffedExt}. Received: ${file.type}`,
        },
        { status: 415 },
      );
    }

    // Re-encode via sharp to strip any malicious payload hidden in the
    // image bytes. This is the defense that mirrors /api/upload.
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    const metadata = await sharp(rawBuffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "Could not determine image dimensions" },
        { status: 400 },
      );
    }
    if (
      metadata.width > MAX_IMAGE_WIDTH ||
      metadata.height > MAX_IMAGE_HEIGHT
    ) {
      return NextResponse.json(
        {
          error: `Image dimensions exceed limit. Max ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px`,
        },
        { status: 413 },
      );
    }
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      return NextResponse.json(
        {
          error: `Image pixel count exceeds limit. Max ${MAX_IMAGE_PIXELS} pixels`,
        },
        { status: 413 },
      );
    }

    let finalBuffer: Buffer<ArrayBufferLike> = rawBuffer;
    let finalExt: SupportedExt = sniffedExt;
    if (sniffedExt === ".jpg") {
      finalBuffer = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
        .autoOrient()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      finalExt = ".jpg";
    } else if (sniffedExt === ".png") {
      finalBuffer = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
        .autoOrient()
        .png({ compressionLevel: 9 })
        .toBuffer();
      finalExt = ".png";
    } else {
      finalBuffer = await sharp(rawBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
        .autoOrient()
        .webp({ quality: 90 })
        .toBuffer();
      finalExt = ".webp";
    }

    if (finalBuffer.length > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Re-encoded image still exceeds 5MB" },
        { status: 413 },
      );
    }

    const filename = `about-${Date.now()}-${randomUUID().slice(0, 8)}${finalExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "about");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), finalBuffer);

    return NextResponse.json({ url: `/uploads/about/${filename}` });
  } catch {
    return NextResponse.json(
      { error: "About-image upload failed" },
      { status: 500 },
    );
  }
}
