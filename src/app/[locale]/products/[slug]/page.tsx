import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import ProductGallery from "./ProductGallery";
import {
  generateAlternates,
  generateOgMeta,
  productJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const getProductBySlug = cache(async (slug: string, locale: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale } },
      images: { orderBy: { order: "asc" } },
      subCategory: {
        include: {
          translations: { where: { locale } },
          category: { include: { translations: { where: { locale } } } },
        },
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, locale);
  if (!product) return {};
  const title = product.translations[0]?.title || slug;
  const description = product.translations[0]?.description || "";
  return {
    title: `${title} — Arvesta Menuiserie France`,
    description,
    alternates: generateAlternates(locale, `/products/${slug}`),
    openGraph: generateOgMeta(
      locale,
      `${title} — Arvesta Menuiserie France`,
      description,
      `/products/${slug}`,
      product.images[0]?.url ? [product.images[0].url] : undefined,
    ),
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  const product = await getProductBySlug(slug, locale);

  if (!product) notFound();

  const title = product.translations[0]?.title || slug;
  const description = product.translations[0]?.description || "";
  const category = product.subCategory.category;
  const catName = category.translations[0]?.name || category.slug;
  const images = product.images.map((img: (typeof product.images)[number]) => ({
    url: img.url,
    alt: img.alt || title,
  }));

  // Related products from same subcategory
  const related = await prisma.product.findMany({
    where: { subCategoryId: product.subCategoryId, id: { not: product.id } },
    include: {
      translations: { where: { locale } },
      images: { orderBy: { order: "asc" }, take: 1 },
    },
    take: 3,
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-(--arvesta-bg)">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd(locale, {
              name: title,
              description,
              slug,
              image: images[0]?.url,
              category: catName,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(locale, [
              { name: "Arvesta", url: "" },
              {
                name: catName,
                url: `/collections/${category.slug}`,
              },
              { name: title },
            ]),
          ),
        }}
      />
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-28">
        <div className="flex items-center gap-2 font-ui text-xs text-(--arvesta-text-muted)">
          <Link
            href={`/${locale}`}
            className="transition-colors hover:text-(--arvesta-gold)"
          >
            {t("backToHome")}
          </Link>
          <span>/</span>
          <Link
            href={`/${locale}/collections/${category.slug}`}
            className="transition-colors hover:text-(--arvesta-gold)"
          >
            {catName}
          </Link>
          <span>/</span>
          <span className="text-(--arvesta-text-secondary)">{title}</span>
        </div>
      </div>

      {/* Product Content */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-20 lg:grid-cols-2 lg:gap-16">
        {/* Info */}
        <div className="flex flex-col justify-center">
          <Link
            href={`/${locale}/collections/${category.slug}`}
            className="mb-4 inline-flex w-fit items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-(--arvesta-gold) transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {t("backToCollection")}
          </Link>

          <span className="mb-3 font-ui text-xs font-bold uppercase tracking-[0.2em] text-(--arvesta-accent)">
            {catName}
          </span>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-white md:text-5xl">
            {title}
          </h1>

          {description && (
            <p className="mb-8 max-w-xl text-base leading-relaxed text-(--arvesta-text-secondary) md:text-lg">
              {description}
            </p>
          )}

          <a
            href={`/${locale}#contact`}
            className="inline-flex w-fit rounded-full border border-[#ffd8a6]/40 bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) px-10 py-4 font-ui text-base font-bold text-[#2b160a] shadow-[0_14px_34px_rgba(232,98,44,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            {t("requestQuote")}
          </a>
        </div>

        {/* Gallery */}
        <ProductGallery images={images} title={title} />
      </section>
      {/* Related Products */}
      {related.length > 0 && (
        <section className="border-t border-(--arvesta-gold)/20 px-4 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-10 text-center font-display text-3xl font-bold text-white">
              {t("relatedProducts")}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item: (typeof related)[number]) => {
                const rTitle = item.translations[0]?.title || item.slug;
                const rImage = item.images[0]?.url || "";
                return (
                  <Link
                    key={item.id}
                    href={`/${locale}/products/${item.slug}`}
                    className="group overflow-hidden rounded-2xl border border-(--arvesta-gold)/20 bg-(--arvesta-bg-card) transition-all duration-500 hover:-translate-y-1 hover:border-(--arvesta-gold)/50"
                  >
                    <div className="relative aspect-4/3 overflow-hidden">
                      {rImage && (
                        <Image
                          src={rImage}
                          alt={rTitle}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-(--arvesta-gold)">
                        {rTitle}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
