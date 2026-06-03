import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import {
  ALLOWED_FILE_TYPES,
  getSafeExt,
  sniffImageType,
  type SupportedExt,
} from "@/lib/media-preprocess";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json(
        { error: "Logo file too large. Max 2MB." },
        { status: 413 },
      );
    }

    const safeExt = getSafeExt(file.name);
    if (!safeExt) {
      return NextResponse.json(
        { error: "Unsupported format. Use PNG, JPG, or WebP." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffedExt = sniffImageType(buffer);
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

    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    // Re-encode and resize to max 512x512
    let processed: Buffer;
    let finalExt: SupportedExt = sniffedExt;
    if (sniffedExt === ".png") {
      processed = await sharp(buffer)
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      finalExt = ".png";
    } else if (sniffedExt === ".webp") {
      processed = await sharp(buffer)
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();
      finalExt = ".webp";
    } else {
      processed = await sharp(buffer)
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      finalExt = ".jpg";
    }

    const filename = `logo-${Date.now()}-${randomUUID().slice(0, 8)}${finalExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), processed);

    const url = `/uploads/products/${filename}`;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Logo upload failed" },
      { status: 500 },
    );
  }
}
