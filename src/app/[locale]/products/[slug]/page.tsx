import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import ProductGallery from "./ProductGallery";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale } },
      images: { take: 1, orderBy: { order: "asc" } },
    },
  });
  if (!product) return {};
  const title = product.translations[0]?.title || slug;
  return {
    title: `${title} — Arvesta Menuiserie France`,
    description: product.translations[0]?.description || "",
    openGraph: {
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale } },
      images: { orderBy: { order: "asc" } },
      category: { include: { translations: { where: { locale } } } },
    },
  });

  if (!product) notFound();

  const title = product.translations[0]?.title || slug;
  const description = product.translations[0]?.description || "";
  const catName =
    product.category.translations[0]?.name || product.category.slug;
  const images = product.images.map((img: (typeof product.images)[number]) => ({
    url: img.url,
    alt: img.alt || title,
  }));

  // Related products from same category
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: {
      translations: { where: { locale } },
      images: { orderBy: { order: "asc" }, take: 1 },
    },
    take: 3,
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-[var(--arvesta-bg)]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-28">
        <div className="flex items-center gap-2 font-ui text-xs text-[var(--arvesta-text-muted)]">
          <Link
            href={`/${locale}`}
            className="transition-colors hover:text-[var(--arvesta-gold)]"
          >
            {t("backToHome")}
          </Link>
          <span>/</span>
          <Link
            href={`/${locale}/collections/${product.category.slug}`}
            className="transition-colors hover:text-[var(--arvesta-gold)]"
          >
            {catName}
          </Link>
          <span>/</span>
          <span className="text-[var(--arvesta-text-secondary)]">{title}</span>
        </div>
      </div>

      {/* Product Content */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-20 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <ProductGallery images={images} title={title} />

        {/* Info */}
        <div className="flex flex-col justify-center">
          <Link
            href={`/${locale}/collections/${product.category.slug}`}
            className="mb-4 inline-flex w-fit items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-[var(--arvesta-gold)] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {t("backToCollection")}
          </Link>

          <span className="mb-3 font-ui text-xs font-bold uppercase tracking-[0.2em] text-[var(--arvesta-accent)]">
            {catName}
          </span>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-white md:text-5xl">
            {title}
          </h1>

          {description && (
            <p className="mb-8 max-w-xl text-base leading-relaxed text-[var(--arvesta-text-secondary)] md:text-lg">
              {description}
            </p>
          )}

          <a
            href={`/${locale}#contact`}
            className="inline-flex w-fit rounded-full border border-[#ffd8a6]/40 bg-gradient-to-b from-[#f6c583] to-[var(--arvesta-accent)] px-10 py-4 font-ui text-base font-bold text-[#2b160a] shadow-[0_14px_34px_rgba(232,98,44,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            {t("requestQuote")}
          </a>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="border-t border-[var(--arvesta-gold)]/20 px-4 py-16 md:py-24">
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
                    className="group overflow-hidden rounded-2xl border border-[var(--arvesta-gold)]/20 bg-[var(--arvesta-bg-card)] transition-all duration-500 hover:-translate-y-1 hover:border-[var(--arvesta-gold)]/50"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
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
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-[var(--arvesta-gold)]">
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
