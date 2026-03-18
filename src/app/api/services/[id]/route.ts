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
  const item = await (prisma as any).serviceItem.findUnique({
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
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { icon, order, published, translations } = parsed.data;

  try {
    const item = await (prisma as any).serviceItem.update({
      where: { id },
      data: {
        icon: icon !== undefined ? icon : undefined,
        order,
        published,
        ...(translations && {
          translations: {
            upsert: translations.map((t) => ({
              where: {
                serviceItemId_locale: { serviceItemId: id, locale: t.locale },
              },
              create: t,
              update: t,
            })),
          },
        }),
      },
      include: { translations: true },
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
    await (prisma as any).serviceItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
