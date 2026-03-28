import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";
import { resolveSlug } from "@/lib/slugify";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  title: z.string().trim().min(1),
});

const pageSchema = z.object({
  imageUrl: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
});

const updateCatalogSchema = z.object({
  slug: z.string().trim().optional(),
  published: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
  coverImage: z.string().trim().optional().nullable(),
  translations: z.array(translationSchema).optional(),
  pages: z.array(pageSchema).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const catalog = await prisma.digitalCatalog.findUnique({
    where: { id },
    include: { translations: true, pages: { orderBy: { order: "asc" } } },
  });

  if (!catalog) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(catalog);
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

  const parsed = updateCatalogSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, published, order, coverImage, translations, pages } =
    parsed.data;

  const updateData: {
    slug?: string;
    published?: boolean;
    order?: number;
    coverImage?: string | null;
  } = {};

  if (slug !== undefined) updateData.slug = slug;
  if (published !== undefined) updateData.published = published;
  if (order !== undefined) updateData.order = order;
  if (coverImage !== undefined) updateData.coverImage = coverImage;

  const resolvedSlug =
    translations && translations.length > 0
      ? resolveSlug(parsed.data.slug, translations)
      : undefined;
  if (resolvedSlug) updateData.slug = resolvedSlug;

  try {
    const catalog = await prisma.digitalCatalog.update({
      where: { id },
      data: {
        ...updateData,
        ...(translations && {
          translations: {
            deleteMany: {},
            create: translations.map((t) => ({
              locale: t.locale,
              title: t.title,
            })),
          },
        }),
        ...(pages && {
          pages: {
            deleteMany: {},
            create: pages.map((p) => ({
              imageUrl: p.imageUrl,
              order: p.order,
            })),
          },
        }),
      },
      include: { translations: true, pages: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(catalog);
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
    await prisma.digitalCatalog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
