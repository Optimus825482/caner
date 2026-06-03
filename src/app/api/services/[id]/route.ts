import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().default(""),
  detail: z.string().trim().default(""),
});

const updateSchema = z.object({
  icon: z.string().nullable().optional(),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
  translations: z.array(translationSchema).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  const item = await prisma.serviceItem.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { icon, order, published, translations } = parsed.data;

  try {
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceItem.update({
        where: { id },
        data: {
          icon: icon !== undefined ? icon : undefined,
          order,
          published,
        },
        include: { translations: true },
      });
      if (translations) {
        for (const t of translations) {
          await tx.serviceItemTranslation.upsert({
            where: {
              serviceItemId_locale: { serviceItemId: id, locale: t.locale },
            },
            create: { ...t, serviceItemId: id },
            update: t,
          });
        }
      }
      return updated;
    });
    return NextResponse.json(item);
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  try {
    await prisma.serviceItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
