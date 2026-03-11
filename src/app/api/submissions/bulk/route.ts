import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";

const idsSchema = z.array(z.string().trim().min(1)).min(1).max(500);

const bulkPatchSchema = z.object({
  ids: idsSchema,
  isRead: z.boolean(),
});

const bulkDeleteSchema = z.object({
  ids: idsSchema,
});

export async function PATCH(req: NextRequest) {
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

  const parsed = bulkPatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ids, isRead } = parsed.data;

  const result = await prisma.contactSubmission.updateMany({
    where: { id: { in: ids } },
    data: { isRead },
  });

  return NextResponse.json({ success: true, count: result.count });
}

export async function DELETE(req: NextRequest) {
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

  const parsed = bulkDeleteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ids } = parsed.data;

  const result = await prisma.contactSubmission.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ success: true, count: result.count });
}
