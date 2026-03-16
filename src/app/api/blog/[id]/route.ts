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

const updateBlogPostSchema = z.object({
  slug: z.string().trim().min(1),
  image: z.string().trim().nullable().optional(),
  published: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  translations: z.array(translationSchema).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(post);
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
  const body = await req.json();
  const parsed = updateBlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, image, published, order, translations } = parsed.data;

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        slug,
        image: image !== undefined ? image : undefined,
        published,
        order,
        ...(translations && {
          translations: {
            upsert: translations.map((t) => ({
              where: { postId_locale: { postId: id, locale: t.locale } },
              create: t,
              update: t,
            })),
          },
        }),
      },
      include: { translations: true },
    });

    return NextResponse.json(post);
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
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
