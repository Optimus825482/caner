import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { resolveTempFileById, saveTempMedia } from "@/lib/media-preprocess";
import { generateDepthMap } from "@/lib/depth-inference";

const depthMapSchema = z.object({
  tempId: z.string().trim().min(1),
});

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

  const parsed = depthMapSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tempId } = parsed.data;

  const temp = await resolveTempFileById(tempId);
  if (!temp) {
    return NextResponse.json(
      { error: "Temp media not found" },
      { status: 404 },
    );
  }

  try {
    const { buffer: depthBuffer } = await generateDepthMap(temp.filePath);
    const { tempId: depthTempId } = await saveTempMedia(depthBuffer, ".png");

    return NextResponse.json({
      depthMapUrl: `/api/media/temp/${depthTempId}`,
      depthMapTempId: depthTempId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("Invalid or corrupt image")) {
      return NextResponse.json(
        { error: "Invalid or corrupt image" },
        { status: 400 },
      );
    }

    if (message.includes("Depth model not available")) {
      return NextResponse.json(
        { error: "Depth model not available" },
        { status: 500 },
      );
    }

    console.error("[depth-map] Generation failed:", message);
    return NextResponse.json(
      { error: "Depth map generation failed", detail: message },
      { status: 500 },
    );
  }
}
