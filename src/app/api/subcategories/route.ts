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
import { revalidateCatalogPages } from "@/lib/revalidate";

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
  const slug = resolveSlug(parsed.data.slug, translations);

  if (!slug) {
    return NextResponse.json(
      {
        error:
          "Could not generate slug. Provide a name in at least one language.",
      },
      { status: 400 },
    );
  }

  // Compound unique: same slug allowed across different categories.
  // Race: two concurrent creates with the same (categoryId, slug) both pass the
  // findUnique check, then both append a unique-looking suffix from the same
  // millisecond and one of them hits P2002. Retry inside a transaction with a
  // fresh suffix on conflict.
  const baseSlug = slug;
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Date.now().toString(36).slice(-4)}-${attempt}`;
    try {
      const subCategory = await prisma.$transaction(async (tx) => {
        const existing = await tx.subCategory.findUnique({
          where: { categoryId_slug: { categoryId, slug: candidate } },
        });
        if (existing && candidate === baseSlug) {
          // First attempt, base slug taken — bail and retry with suffix
          return null;
        }
        return tx.subCategory.create({
          data: {
            slug: candidate,
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
      });

      if (subCategory) {
        revalidateCatalogPages();
        return NextResponse.json(subCategory, { status: 201 });
      }
    } catch (error) {
      // P2002 = unique constraint. If we still have attempts left, retry.
      const code = (error as { code?: string }).code;
      if (code === "P2002" && attempt < maxAttempts - 1) continue;
      return prismaWriteErrorResponse(error);
    }
  }

  return NextResponse.json(
    { error: "Could not allocate unique slug after retries" },
    { status: 409 },
  );
}
