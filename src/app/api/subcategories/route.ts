import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import {
  buildClientKey,
  createSiteSettingRateLimitAdapter,
  enforceRateLimit,
  enforceSameOrigin,
} from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";
import { resolveSlug } from "@/lib/slugify";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

const createSchema = z.object({
  slug: z.string().trim().optional(),
  categoryId: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  image: z.string().trim().min(1).optional(),
  translations: z.array(translationSchema).min(1),
});

const rlAdapter = createSiteSettingRateLimitAdapter(prisma.siteSetting);

export async function GET(req: NextRequest) {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const categoryId = req.nextUrl.searchParams.get("categoryId");

  const where = categoryId ? { categoryId } : {};

  const subCategories = await prisma.subCategory.findMany({
    where,
    include: {
      translations: true,
      category: { include: { translations: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });
  return NextResponse.json(subCategories);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const clientKey = buildClientKey(req, "subcategories:create");
  const rateLimited = await enforceRateLimit({
    adapter: rlAdapter,
    keyPrefix: "subcategories_mutation_rl",
    clientKey,
    windowMs: 60_000,
    maxRequests: 30,
    errorMessage: "Too many requests. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { categoryId, order, image, translations } = parsed.data;
  let slug = resolveSlug(parsed.data.slug, translations);

  if (!slug) {
    return NextResponse.json(
      {
        error:
          "Could not generate slug. Provide a name in at least one language.",
      },
      { status: 400 },
    );
  }

  // Compound unique: same slug allowed across different categories
  const existing = await prisma.subCategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });
  if (existing) {
    // Same category already has this slug — append timestamp suffix
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  try {
    const subCategory = await prisma.subCategory.create({
      data: {
        slug,
        categoryId,
        order,
        image,
        translations: {
          create: translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            description: t.description,
          })),
        },
      },
      include: { translations: true },
    });

    return NextResponse.json(subCategory, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
