import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const createFaqSchema = z.object({
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
  translations: z.array(translationSchema).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publishedOnly = searchParams.get("published") === "true";

  const items = await prisma.faqItem.findMany({
    where: publishedOnly ? { published: true } : undefined,
    include: { translations: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const body = await req.json();
  const parsed = createFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { order, published, translations } = parsed.data;

  try {
    const item = await prisma.faqItem.create({
      data: {
        order,
        published,
        translations: { create: translations },
      },
      include: { translations: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
