import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";
import { resolveSlug } from "@/lib/slugify";
import { revalidateCatalogPages } from "@/lib/revalidate";

const productTranslationSchema = z.object({
  locale: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

const productImageSchema = z.object({
  url: z.string().trim().min(1),
  alt: z.string().trim().optional(),
  order: z.coerce.number().int().default(0),
});

const updateProductSchema = z.object({
  slug: z.string().trim().optional(),
  subCategoryId: z.string().trim().min(1),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  translations: z.array(productTranslationSchema).optional(),
  images: z.array(productImageSchema).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { translations: true, images: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(product);
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

  const parsed = updateProductSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { subCategoryId, featured, order, translations, images } = parsed.data;
  const slug = resolveSlug(parsed.data.slug, translations ?? []);

  const txOperations: Prisma.PrismaPromise<unknown>[] = [
    prisma.product.update({
      where: { id },
      data: { slug, subCategoryId, featured, order },
    }),
    ...(translations?.map((t) =>
      prisma.productTranslation.upsert({
        where: { productId_locale: { productId: id, locale: t.locale } },
        update: { title: t.title, description: t.description },
        create: {
          productId: id,
          locale: t.locale,
          title: t.title,
          description: t.description,
        },
      }),
    ) ?? []),
  ];

  if (images) {
    txOperations.push(
      prisma.productImage.deleteMany({ where: { productId: id } }),
    );
    txOperations.push(
      prisma.productImage.createMany({
        data: images.map((img) => ({
          productId: id,
          url: img.url,
          alt: img.alt,
          order: img.order,
        })),
      }),
    );
  }

  try {
    await prisma.$transaction(txOperations);

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { translations: true, images: true },
    });

    revalidateCatalogPages();
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
    await prisma.product.delete({ where: { id } });
    revalidateCatalogPages();
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
