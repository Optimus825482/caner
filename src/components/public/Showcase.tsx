import { prisma } from "@/lib/prisma";
import ShowcaseClient from "./ShowcaseClient";

export default async function Showcase({ locale }: { locale: string }) {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      include: { translations: { where: { locale } } },
      orderBy: { order: "asc" },
    }),
    prisma.product.findMany({
      include: {
        translations: { where: { locale } },
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { include: { translations: { where: { locale } } } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  const cats = categories.map((c: (typeof categories)[number]) => ({
    slug: c.slug,
    name: c.translations[0]?.name || c.slug,
  }));

  const items = products.map((p: (typeof products)[number]) => ({
    id: p.id,
    slug: p.slug,
    categorySlug: p.category.slug,
    categoryName: p.category.translations[0]?.name || p.category.slug,
    title: p.translations[0]?.title || p.slug,
    description: p.translations[0]?.description || "",
    image: p.images[0]?.url || "",
    featured: p.featured,
  }));

  return <ShowcaseClient categories={cats} products={items} />;
}
