import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arvesta-france.com";

const LOCALES = ["fr", "en", "tr"];

function alternates(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/fr${path}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: Array<{
    slug: string;
    updatedAt: Date | null;
    createdAt: Date;
  }> = [];
  let categories: Array<{
    slug: string;
    updatedAt: Date | null;
    createdAt: Date;
  }> = [];

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma");
      [products, categories] = await Promise.all([
        prisma.product.findMany({
          select: { slug: true, updatedAt: true, createdAt: true },
        }),
        prisma.category.findMany({
          select: { slug: true, updatedAt: true, createdAt: true },
        }),
      ]);
    } catch {
      // Build ortamında DB erişimi yoksa yalnızca statik sayfalarla sitemap üretilir.
    }
  }

  // Static pages
  const staticPages = ["", "/about", "/privacy"];
  const pages: MetadataRoute.Sitemap = staticPages.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.6,
      alternates: alternates(path),
    })),
  );

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.flatMap((product) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}/products/${product.slug}`,
      lastModified: product.updatedAt ?? product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: alternates(`/products/${product.slug}`),
    })),
  );

  // Collection pages
  const collectionPages: MetadataRoute.Sitemap = categories.flatMap(
    (category) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}/collections/${category.slug}`,
        lastModified: category.updatedAt ?? category.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: alternates(`/collections/${category.slug}`),
      })),
  );

  return [...pages, ...productPages, ...collectionPages];
}
