import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { prismaWriteErrorResponse } from "@/lib/api-helpers";

const translationSchema = z.object({
  locale: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
  title: z.string().trim().default(""),
});

const createSchema = z.object({
  photo: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
  role: z.enum(["lead", "member"]).default("member"),
  translations: z.array(translationSchema).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publishedOnly = searchParams.get("published") === "true";

  const items = await prisma.teamMember.findMany({
    where: publishedOnly ? { published: true } : undefined,
    include: { translations: true },
    orderBy: [
      { role: "asc" }, // "lead" < "member" → lead üstte
      { order: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { photo, email, phone, order, published, role, translations } =
    parsed.data;

  try {
    const item = await prisma.teamMember.create({
      data: {
        photo: photo || null,
        email: email || null,
        phone: phone || null,
        order,
        published,
        role: role ?? "member",
        translations: { create: translations },
      },
      include: { translations: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
