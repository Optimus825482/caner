import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arvesta-france.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["fr", "en", "tr"];

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: { slug: true, updatedAt: true, createdAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true, createdAt: true },
    }),
  ]);

  const pages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
  }));

  const productPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    products.map((product) => ({
      url: `${BASE_URL}/${locale}/products/${product.slug}`,
      lastModified: product.updatedAt ?? product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  const collectionPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    categories.map((category) => ({
      url: `${BASE_URL}/${locale}/collections/${category.slug}`,
      lastModified: category.updatedAt ?? category.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  return [...pages, ...productPages, ...collectionPages];
}
