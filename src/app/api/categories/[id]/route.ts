import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";

const categoryTranslationSchema = z.object({
  locale: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

const updateCategorySchema = z.object({
  slug: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  image: z.string().trim().min(1).optional(),
  translations: z.array(categoryTranslationSchema).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCategorySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, order, image, translations } = parsed.data;

  const txOperations = [
    prisma.category.update({
      where: { id },
      data: { slug, order, image },
    }),
    ...(translations?.map((t) =>
      prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: id, locale: t.locale } },
        update: { name: t.name, description: t.description },
        create: {
          categoryId: id,
          locale: t.locale,
          name: t.name,
          description: t.description,
        },
      }),
    ) ?? []),
  ];

  try {
    await prisma.$transaction(txOperations);

    const updated = await prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    });
    return NextResponse.json(updated);
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
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
