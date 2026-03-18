import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { ProductsPageContent } from "@/components/public/ProductsPageContent";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Nos Produits — Arvesta Menuiserie France",
    description:
      "Découvrez notre gamme complète de mobilier sur mesure : cuisines, dressings, salles de bains et espaces de vie.",
  },
  en: {
    title: "Our Products — Arvesta Menuiserie France",
    description:
      "Discover our complete range of bespoke furniture: kitchens, wardrobes, bathrooms and living spaces.",
  },
  tr: {
    title: "Ürünlerimiz — Arvesta Menuiserie France",
    description:
      "Özel tasarım mobilya yelpazemizi keşfedin: mutfaklar, gardıroplar, banyolar ve yaşam alanları.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.fr;
  return {
    title: m.title,
    description: m.description,
    alternates: generateAlternates(locale, "/products"),
    openGraph: generateOgMeta(locale, m.title, m.description, "/products"),
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "productsPage" });

  const categories = (await (prisma as any).category.findMany({
    include: {
      translations: { where: { locale } },
      subCategories: {
        include: {
          translations: { where: { locale } },
          products: {
            include: {
              translations: { where: { locale } },
              images: { orderBy: { order: "asc" }, take: 1 },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })) as Array<{
    id: string;
    slug: string;
    translations: Array<{ locale: string; name: string }>;
    subCategories: Array<{
      id: string;
      slug: string;
      translations: Array<{ locale: string; name: string }>;
      products: Array<{
        id: string;
        slug: string;
        translations: Array<{ locale: string; title: string }>;
        images: Array<{ url: string }>;
      }>;
    }>;
  }>;

  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: t("title") },
  ]);

  // Flatten products for the grid
  const allProducts = categories.flatMap((cat) => {
    const catName = cat.translations[0]?.name || cat.slug;
    return cat.subCategories.flatMap((sub) => {
      const subName = sub.translations[0]?.name || sub.slug;
      return sub.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.translations[0]?.title || p.slug,
        image: p.images[0]?.url || null,
        categoryId: cat.id,
        categoryName: catName,
        subCategoryId: sub.id,
        subCategoryName: subName,
      }));
    });
  });

  const filterCategories = categories
    .filter((c) => c.subCategories.some((sc) => sc.products.length > 0))
    .map((c) => ({
      id: c.id,
      name: c.translations[0]?.name || c.slug,
      subCategories: c.subCategories
        .filter((sc) => sc.products.length > 0)
        .map((sc) => ({
          id: sc.id,
          name: sc.translations[0]?.name || sc.slug,
        })),
    }));

  const publishedCatalogs = await prisma.digitalCatalog.findMany({
    where: { published: true },
    include: {
      translations: { where: { locale } },
      pages: { orderBy: { order: "asc" }, take: 1 },
    },
    orderBy: { order: "asc" },
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />

      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-(--arvesta-text-secondary)">
            {t("subtitle")}
          </p>
        </div>

        <ProductsPageContent
          products={allProducts}
          categories={filterCategories}
          catalogs={publishedCatalogs}
          locale={locale}
          labels={{
            all: t("filterAll"),
            allSubCategories: t("filterAllSub"),
            categories: t("filterCategories"),
            digitalCatalog: t("digitalCatalog"),
            collectionSuffix: t("collectionSuffix"),
          }}
        />

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-(--arvesta-gold)/20 bg-[rgba(255,255,255,0.02)] p-8 text-center">
          <h2 className="mb-3 font-display text-xl font-bold text-white">
            {t("ctaTitle")}
          </h2>
          <p className="mb-6 text-sm text-(--arvesta-text-secondary)">
            {t("ctaDesc")}
          </p>
          <Link
            href={`/${locale}#contact`}
            className="inline-flex rounded-full border border-[#ffd8a6]/40 bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) px-8 py-3 font-ui text-sm font-bold text-[#2b160a] shadow-[0_14px_34px_rgba(232,98,44,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            {t("ctaBtn")}
          </Link>
        </div>
      </div>
    </main>
  );
}
