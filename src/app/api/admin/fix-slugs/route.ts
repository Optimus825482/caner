import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { revalidateCatalogPages } from "@/lib/revalidate";

/**
 * One-time fix: sanitize category & subcategory slugs that contain
 * spaces, accents, or other non-URL-safe characters.
 * DELETE this route after running it once in production.
 */
export async function POST() {
  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const categories = await prisma.category.findMany();
  const subCategories = await prisma.subCategory.findMany();

  const fixes: { type: string; id: string; old: string; new: string }[] = [];

  for (const cat of categories) {
    const clean = slugify(cat.slug);
    if (clean !== cat.slug) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { slug: clean },
      });
      fixes.push({ type: "category", id: cat.id, old: cat.slug, new: clean });
    }
  }

  for (const sub of subCategories) {
    const clean = slugify(sub.slug);
    if (clean !== sub.slug) {
      await prisma.subCategory.update({
        where: { id: sub.id },
        data: { slug: clean },
      });
      fixes.push({
        type: "subcategory",
        id: sub.id,
        old: sub.slug,
        new: clean,
      });
    }
  }

  if (fixes.length > 0) {
    revalidateCatalogPages();
  }

  return NextResponse.json({ fixed: fixes.length, details: fixes });
}
