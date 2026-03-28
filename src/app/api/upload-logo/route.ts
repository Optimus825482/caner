import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

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

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json(
      { error: "Unsupported format. Use PNG, JPG, or WebP." },
      { status: 415 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;

  // Re-encode and resize to max 512x512
  let processed: Buffer;
  if (ext === ".png") {
    processed = await sharp(buffer)
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } else if (ext === ".webp") {
    processed = await sharp(buffer)
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();
  } else {
    processed = await sharp(buffer)
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  }

  const filename = `logo-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), processed);

  const url = `/uploads/products/${filename}`;
  return NextResponse.json({ url });
}
