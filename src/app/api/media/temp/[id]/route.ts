import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { readFile } from "fs/promises";
import { resolveTempFileById } from "@/lib/media-preprocess";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  const temp = await resolveTempFileById(id);

  if (!temp) {
    return NextResponse.json({ error: "Temp media not found" }, { status: 404 });
  }

  const buffer = await readFile(temp.filePath);

  const mime = temp.ext === ".jpg" ? "image/jpeg" : temp.ext === ".png" ? "image/png" : "image/webp";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "no-store",
    },
  });
}
