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

const createProductSchema = z.object({
  slug: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  translations: z.array(productTranslationSchema).min(1),
  images: z.array(productImageSchema).default([]),
});

const productRateLimitAdapter = createSiteSettingRateLimitAdapter(prisma.siteSetting);
const PRODUCT_MUTATION_RATE_LIMIT_WINDOW_MS = 60_000;
const PRODUCT_MUTATION_RATE_LIMIT_MAX_REQUESTS = 30;

function prismaWriteErrorResponse(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;

  if (code === "P2002") {
    return NextResponse.json(
      { error: "Resource already exists", code },
      { status: 409 },
    );
  }

  if (code === "P2025") {
    return NextResponse.json(
      { error: "Resource not found", code },
      { status: 404 },
    );
  }

  if (code === "P2003" || code === "P2014") {
    return NextResponse.json(
      { error: "Invalid relation reference", code },
      { status: 422 },
    );
  }

  return NextResponse.json({ error: "Database write failed" }, { status: 500 });
}

export async function GET() {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const products = await prisma.product.findMany({
    include: {
      translations: true,
      images: { orderBy: { order: "asc" } },
      category: { include: { translations: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const clientKey = buildClientKey(req, "products:create");
  const rateLimited = await enforceRateLimit({
    adapter: productRateLimitAdapter,
    keyPrefix: "products_mutation_rl",
    clientKey,
    windowMs: PRODUCT_MUTATION_RATE_LIMIT_WINDOW_MS,
    maxRequests: PRODUCT_MUTATION_RATE_LIMIT_MAX_REQUESTS,
    errorMessage: "Too many product mutation requests. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProductSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, categoryId, featured, order, translations, images } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        slug,
        categoryId,
        featured,
        order,
        translations: {
          create: translations.map((translation) => ({
            locale: translation.locale,
            title: translation.title,
            description: translation.description,
          })),
        },
        images: {
          create: images.map((image) => ({
            url: image.url,
            alt: image.alt,
            order: image.order,
          })),
        },
      },
      include: { translations: true, images: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
