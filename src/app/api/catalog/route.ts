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

const createCatalogSchema = z.object({
  slug: z.string().trim().optional(),
  published: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  coverImage: z.string().trim().optional(),
  translations: z.array(translationSchema).min(1),
  pages: z.array(pageSchema).default([]),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publishedOnly = searchParams.get("published") === "true";
  const slug = searchParams.get("slug");

  const authResult = await requireAdminAuth();
  const isAdmin = authResult.ok;

  // Slug ile tek katalog (public veya admin)
  if (slug) {
    const catalog = await prisma.digitalCatalog.findUnique({
      where: { slug },
      include: { translations: true, pages: { orderBy: { order: "asc" } } },
    });
    if (!catalog) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!catalog.published && !isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(catalog);
  }

  // Public: sadece yayınlanmış kataloglar, auth gerekmez
  if (publishedOnly && !isAdmin) {
    const catalogs = await prisma.digitalCatalog.findMany({
      where: { published: true },
      include: { translations: true, pages: { orderBy: { order: "asc" } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(catalogs);
  }

  // Admin: tüm kataloglar
  if (!isAdmin) return authResult.response;

  const catalogs = await prisma.digitalCatalog.findMany({
    where: publishedOnly ? { published: true } : undefined,
    include: { translations: true, pages: { orderBy: { order: "asc" } } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(catalogs);
}

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

  const parsed = createCatalogSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, published, order, coverImage, translations, pages } =
    parsed.data;
  const resolvedSlug = resolveSlug(slug, translations);

  if (!resolvedSlug) {
    return NextResponse.json(
      {
        error:
          "Could not generate slug. Provide a title in at least one language.",
      },
      { status: 400 },
    );
  }

  try {
    const catalog = await prisma.digitalCatalog.create({
      data: {
        slug: resolvedSlug,
        published,
        order,
        coverImage: coverImage || null,
        translations: {
          create: translations.map((t) => ({
            locale: t.locale,
            title: t.title,
          })),
        },
        pages: {
          create: pages.map((p) => ({
            imageUrl: p.imageUrl,
            order: p.order,
          })),
        },
      },
      include: { translations: true, pages: true },
    });

    return NextResponse.json(catalog, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
