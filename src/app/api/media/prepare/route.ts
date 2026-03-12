import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readFile } from "fs/promises";
import path from "path";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import {
  resolveTempFileById,
  saveTempMedia,
  sniffImageType,
} from "@/lib/media-preprocess";

const prepareSchema = z.object({
  sourceUrl: z.string().trim().min(1),
});

function toPublicFilePath(sourceUrl: string): string | null {
  if (!sourceUrl.startsWith("/uploads/products/")) return null;

  const safeRelative = sourceUrl.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", safeRelative);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = prepareSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { sourceUrl } = parsed.data;

  let buffer: Buffer;

  if (sourceUrl.startsWith("/api/media/temp/")) {
    const tempId = sourceUrl.split("/").pop() || "";
    const temp = await resolveTempFileById(tempId);
    if (!temp) {
      return NextResponse.json({ error: "Temp media not found" }, { status: 404 });
    }
    buffer = await readFile(temp.filePath);
  } else {
    const publicFilePath = toPublicFilePath(sourceUrl);
    if (!publicFilePath) {
      return NextResponse.json(
        { error: "Unsupported sourceUrl. Only /uploads/products/* is allowed." },
        { status: 400 },
      );
    }

    try {
      buffer = await readFile(publicFilePath);
    } catch {
      return NextResponse.json({ error: "Source image not found" }, { status: 404 });
    }
  }

  const ext = sniffImageType(buffer);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported source image format" },
      { status: 415 },
    );
  }

  const saved = await saveTempMedia(buffer, ext);

  return NextResponse.json({
    tempId: saved.tempId,
    previewUrl: `/api/media/temp/${saved.tempId}`,
  });
}
