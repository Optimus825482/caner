import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  title: z.string().trim().min(1),
  excerpt: z.string().trim().optional(),
  content: z.string().min(1),
});

const createBlogPostSchema = z.object({
  slug: z.string().trim().min(1),
  image: z.string().trim().optional(),
  published: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  translations: z.array(translationSchema).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publishedOnly = searchParams.get("published") === "true";

  const posts = await prisma.blogPost.findMany({
    where: publishedOnly ? { published: true } : undefined,
    include: { translations: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const body = await req.json();
  const parsed = createBlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, image, published, order, translations } = parsed.data;

  try {
    const post = await prisma.blogPost.create({
      data: {
        slug,
        image: image || null,
        published,
        order,
        translations: { create: translations },
      },
      include: { translations: true },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
