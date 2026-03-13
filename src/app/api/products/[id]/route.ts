import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";

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
  slug: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  translations: z.array(productTranslationSchema).optional(),
  images: z.array(productImageSchema).optional(),
});

function prismaWriteErrorResponse(error: unknown) {
  // DÜZELTME: Native Prisma Error Class üzerinden strict tip kontrolü.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Resource already exists", code: error.code },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Resource not found", code: error.code },
        { status: 404 },
      );
    }

    if (error.code === "P2003" || error.code === "P2014") {
      return NextResponse.json(
        { error: "Invalid relation reference", code: error.code },
        { status: 422 },
      );
    }
  }

  return NextResponse.json({ error: "Database write failed" }, { status: 500 });
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

  const { slug, categoryId, featured, order, translations, images } = parsed.data;

  const txOperations: Prisma.PrismaPromise<unknown>[] = [
    prisma.product.update({
      where: { id },
      data: { slug, categoryId, featured, order },
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
    txOperations.push(prisma.productImage.deleteMany({ where: { productId: id } }));
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
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
