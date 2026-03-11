import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";

const heroTranslationSchema = z.object({
  locale: z.string().trim().min(1),
  badge: z.string().trim().optional(),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
});

const createHeroSlideSchema = z.object({
  image: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  translations: z.array(heroTranslationSchema).min(1),
});

const updateHeroSlideSchema = z.object({
  id: z.string().trim().min(1),
  image: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  translations: z.array(heroTranslationSchema).optional(),
});

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
  const slides = await prisma.heroSlide.findMany({
    include: { translations: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(slides);
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

  const parsed = createHeroSlideSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { image, order, active, translations } = parsed.data;

  try {
    const slide = await prisma.heroSlide.create({
      data: {
        image,
        order,
        active,
        translations: {
          create: translations.map((translation) => ({
            locale: translation.locale,
            badge: translation.badge,
            title: translation.title,
            subtitle: translation.subtitle,
          })),
        },
      },
      include: { translations: true },
    });
    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
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

  const parsed = updateHeroSlideSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, image, order, active, translations } = parsed.data;

  const txOperations = [
    prisma.heroSlide.update({
      where: { id },
      data: { image, order, active },
    }),
    ...(translations?.map((t) =>
      prisma.heroSlideTranslation.upsert({
        where: { slideId_locale: { slideId: id, locale: t.locale } },
        update: { badge: t.badge, title: t.title, subtitle: t.subtitle },
        create: {
          slideId: id,
          locale: t.locale,
          badge: t.badge,
          title: t.title,
          subtitle: t.subtitle,
        },
      }),
    ) ?? []),
  ];

  try {
    await prisma.$transaction(txOperations);

    const updated = await prisma.heroSlide.findUnique({
      where: { id },
      include: { translations: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.heroSlide.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
