import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { slugify } from "@/lib/slugify";
import { revalidateCatalogPages } from "@/lib/revalidate";

/**
 * One-time fix: sanitize category & subcategory slugs that contain
 * spaces, accents, or other non-URL-safe characters.
 * DELETE this route after running it once in production.
 */
export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const [categories, subCategories] = await Promise.all([
    prisma.category.findMany(),
    prisma.subCategory.findMany(),
  ]);

  // Pre-compute all rewrites and detect collisions before writing anything.
  // A "collision" is two rows whose cleaned slugs would clash on the same
  // scope (category slug must be globally unique; subcategory slug is unique
  // per parent category).
  const catFixes: { id: string; old: string; new: string }[] = [];
  const subFixes: { id: string; old: string; new: string }[] = [];
  const catTaken = new Map<string, string>();
  const subTaken = new Map<string, Set<string>>();

  for (const cat of categories) {
    const clean = slugify(cat.slug);
    if (clean === cat.slug) continue;
    const existingOwner = catTaken.get(clean);
    if (existingOwner && existingOwner !== cat.id) {
      // Another category already targets this slug — skip with warning.
      continue;
    }
    catTaken.set(clean, cat.id);
    catFixes.push({ id: cat.id, old: cat.slug, new: clean });
  }

  for (const sub of subCategories) {
    const clean = slugify(sub.slug);
    if (clean === sub.slug) continue;
    const taken = subTaken.get(sub.categoryId) ?? new Set<string>();
    if (taken.has(clean)) continue;
    taken.add(clean);
    subTaken.set(sub.categoryId, taken);
    subFixes.push({ id: sub.id, old: sub.slug, new: clean });
  }

  // Apply all updates in a single transaction so partial failures roll back.
  await prisma.$transaction([
    ...catFixes.map((f) =>
      prisma.category.update({ where: { id: f.id }, data: { slug: f.new } }),
    ),
    ...subFixes.map((f) =>
      prisma.subCategory.update({
        where: { id: f.id },
        data: { slug: f.new },
      }),
    ),
  ]);

  const fixed = catFixes.length + subFixes.length;
  if (fixed > 0) revalidateCatalogPages();

  return NextResponse.json({
    fixed,
    details: [
      ...catFixes.map((f) => ({ type: "category", ...f })),
      ...subFixes.map((f) => ({ type: "subcategory", ...f })),
    ],
  });
}
