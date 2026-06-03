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

const updateSchema = z.object({
  photo: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
  role: z.enum(["lead", "member"]).optional(),
  translations: z.array(translationSchema).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  const item = await prisma.teamMember.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  return NextResponse.json(item);
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { photo, email, phone, order, published, role, translations } =
    parsed.data;

  try {
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.teamMember.update({
        where: { id },
        data: {
          photo: photo !== undefined ? photo : undefined,
          email: email !== undefined ? email : undefined,
          phone: phone !== undefined ? phone : undefined,
          order,
          published,
          ...(role !== undefined && { role }),
        },
        include: { translations: true },
      });
      if (translations) {
        for (const t of translations) {
          await tx.teamMemberTranslation.upsert({
            where: {
              teamMemberId_locale: { teamMemberId: id, locale: t.locale },
            },
            create: { ...t, teamMemberId: id },
            update: t,
          });
        }
      }
      return updated;
    });
    return NextResponse.json(item);
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
    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
