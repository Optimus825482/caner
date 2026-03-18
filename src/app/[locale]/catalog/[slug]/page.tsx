import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { CatalogFlipbook } from "@/components/public/CatalogFlipbook";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const catalog = await prisma.digitalCatalog.findUnique({
    where: { slug, published: true },
    include: { translations: true },
  });
  if (!catalog) return { title: "Not Found" };

  const tr = catalog.translations.find((t) => t.locale === locale) ||
    catalog.translations[0];
  const title = tr?.title || catalog.slug;

  return {
    title: `${title} — Arvesta`,
    alternates: generateAlternates(locale, `/catalog/${slug}`),
    openGraph: generateOgMeta(locale, title, "", `/catalog/${slug}`),
  };
}

export default async function CatalogViewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const catalog = await prisma.digitalCatalog.findUnique({
    where: { slug, published: true },
    include: {
      translations: true,
      pages: { orderBy: { order: "asc" } },
    },
  });

  if (!catalog) notFound();

  const tr = catalog.translations.find((t) => t.locale === locale) ||
    catalog.translations[0];
  const title = tr?.title || catalog.slug;

  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: "Ürünlerimiz", url: "/products" },
    { name: title, url: `/catalog/${slug}` },
  ]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />

      <div className="mx-auto max-w-4xl">
        <CatalogFlipbook
          pages={catalog.pages}
          title={title}
        />
      </div>
    </main>
  );
}
