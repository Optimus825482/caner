import type { MetadataRoute } from "next";
import { absolutePublicUrl } from "@/lib/seo";

const LOCALES = ["fr", "en", "tr"] as const;

function alternates(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = absolutePublicUrl(loc, path);
  }
  languages["x-default"] = absolutePublicUrl("fr", path);
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
  let blogPosts: Array<{
    slug: string;
    updatedAt: Date | null;
    createdAt: Date;
  }> = [];
  let catalogs: Array<{
    slug: string;
    updatedAt: Date | null;
    createdAt: Date;
  }> = [];

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma");
      [products, categories, blogPosts, catalogs] = await Promise.all([
        prisma.product.findMany({
          select: { slug: true, updatedAt: true, createdAt: true },
        }),
        prisma.category.findMany({
          select: { slug: true, updatedAt: true, createdAt: true },
        }),
        prisma.blogPost.findMany({
          where: { published: true },
          select: { slug: true, updatedAt: true, createdAt: true },
        }),
        prisma.digitalCatalog.findMany({
          where: { published: true },
          select: { slug: true, updatedAt: true, createdAt: true },
        }),
      ]);
    } catch {
      // Build ortamında DB erişimi yoksa yalnızca statik sayfalarla sitemap üretilir.
    }
  }

  // Static pages — use a fixed date to avoid misleading Google with every build
  const STATIC_LAST_MODIFIED = new Date("2026-04-01T00:00:00Z");
  const staticPages = [
    "",
    "/about",
    "/privacy",
    "/faq",
    "/blog",
    "/services",
    "/products",
  ];
  const pages: MetadataRoute.Sitemap = staticPages.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absolutePublicUrl(locale, path),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.6,
      alternates: alternates(path),
    })),
  );

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.flatMap((product) =>
    LOCALES.map((locale) => ({
      url: absolutePublicUrl(locale, `/products/${product.slug}`),
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
        url: absolutePublicUrl(locale, `/collections/${category.slug}`),
        lastModified: category.updatedAt ?? category.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: alternates(`/collections/${category.slug}`),
      })),
  );

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.flatMap((post) =>
    LOCALES.map((locale) => ({
      url: absolutePublicUrl(locale, `/blog/${post.slug}`),
      lastModified: post.updatedAt ?? post.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: alternates(`/blog/${post.slug}`),
    })),
  );

  // Digital catalog pages
  const catalogPages: MetadataRoute.Sitemap = catalogs.flatMap((catalog) =>
    LOCALES.map((locale) => ({
      url: absolutePublicUrl(locale, `/catalog/${catalog.slug}`),
      lastModified: catalog.updatedAt ?? catalog.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: alternates(`/catalog/${catalog.slug}`),
    })),
  );

  return [
    ...pages,
    ...productPages,
    ...collectionPages,
    ...blogPages,
    ...catalogPages,
  ];
}
