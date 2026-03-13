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

const categoryTranslationSchema = z.object({
  locale: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

const createCategorySchema = z.object({
  slug: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  image: z.string().trim().min(1).optional(),
  translations: z.array(categoryTranslationSchema).min(1),
});

const categoryRateLimitAdapter = createSiteSettingRateLimitAdapter(
  prisma.siteSetting,
);
const CATEGORY_MUTATION_RATE_LIMIT_WINDOW_MS = 60_000;
const CATEGORY_MUTATION_RATE_LIMIT_MAX_REQUESTS = 30;

export async function GET() {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const categories = await prisma.category.findMany({
    include: { translations: true, _count: { select: { products: true } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const clientKey = buildClientKey(req, "categories:create");
  const rateLimited = await enforceRateLimit({
    adapter: categoryRateLimitAdapter,
    keyPrefix: "categories_mutation_rl",
    clientKey,
    windowMs: CATEGORY_MUTATION_RATE_LIMIT_WINDOW_MS,
    maxRequests: CATEGORY_MUTATION_RATE_LIMIT_MAX_REQUESTS,
    errorMessage: "Too many category mutation requests. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCategorySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, order, image, translations } = parsed.data;

  try {
    const category = await prisma.category.create({
      data: {
        slug,
        order,
        image,
        translations: {
          create: translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name,
            description: translation.description,
          })),
        },
      },
      include: { translations: true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
