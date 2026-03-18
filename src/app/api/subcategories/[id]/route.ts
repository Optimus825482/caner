import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";
import { resolveSlug } from "@/lib/slugify";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

const updateSchema = z.object({
  slug: z.string().trim().optional(),
  categoryId: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  image: z.string().trim().min(1).optional(),
  translations: z.array(translationSchema).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  const sub = await (prisma as any).subCategory.findUnique({
    where: { id },
    include: {
      translations: true,
      category: { include: { translations: true } },
    },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
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
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { categoryId, order, image, translations } = parsed.data;
  const slug = resolveSlug(parsed.data.slug, translations ?? []);

  const txOps = [
    (prisma as any).subCategory.update({
      where: { id },
      data: { slug, categoryId, order, image },
    }),
    ...(translations?.map((t) =>
      (prisma as any).subCategoryTranslation.upsert({
        where: {
          subCategoryId_locale: { subCategoryId: id, locale: t.locale },
        },
        update: { name: t.name, description: t.description },
        create: {
          subCategoryId: id,
          locale: t.locale,
          name: t.name,
          description: t.description,
        },
      }),
    ) ?? []),
  ];

  try {
    await prisma.$transaction(txOps);
    const updated = await (prisma as any).subCategory.findUnique({
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
    // Check for child products (onDelete: Restrict prevents cascade)
    const productCount = await prisma.product.count({
      where: { subCategoryId: id },
    });
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: "HAS_CHILDREN",
          message: `Bu alt kategorinin ${productCount} ürünü var. Önce ürünleri silin veya taşıyın.`,
        },
        { status: 409 },
      );
    }

    await (prisma as any).subCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
