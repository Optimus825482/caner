import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const getCategoryBySlug = cache(async (slug: string, locale: string) => {
  return prisma.category.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug, locale);
  if (!category) return {};
  const name = category.translations[0]?.name || slug;
  return {
    title: `${name} — Arvesta Menuiserie France`,
    description: category.translations[0]?.description || "",
  };
}

export default async function CollectionPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  const category = await getCategoryBySlug(slug, locale);

  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    include: {
      translations: { where: { locale } },
      images: { orderBy: { order: "asc" }, take: 1 },
    },
    orderBy: { order: "asc" },
  });

  const name = category.translations[0]?.name || slug;
  const desc = category.translations[0]?.description || "";

  return (
    <div className="min-h-screen bg-(--arvesta-bg)">
      {/* Hero Banner */}
      <section className="relative flex h-[50vh] min-h-90 items-end overflow-hidden">
        <Image
          src={category.image || "/uploads/products/kitchen-1.jpg"}
          alt={name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-(--arvesta-bg) via-black/50 to-black/30" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12">
          <Link
            href={`/${locale}#savoir-faire`}
            className="mb-4 inline-flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-(--arvesta-gold) transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {t("allCollections")}
          </Link>
          <h1 className="font-display text-4xl font-bold text-white md:text-6xl">
            {name}
          </h1>
          {desc && (
            <p className="mt-4 max-w-2xl text-lg text-(--arvesta-text-secondary)">
              {desc}
            </p>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        {products.length === 0 ? (
          <p className="text-center text-(--arvesta-text-muted)">
            {t("noProducts")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: (typeof products)[number]) => {
              const title = product.translations[0]?.title || product.slug;
              const image = product.images[0]?.url || "";
              return (
                <Link
                  key={product.id}
                  href={`/${locale}/products/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-(--arvesta-gold)/20 bg-(--arvesta-bg-card) transition-all duration-500 hover:-translate-y-1 hover:border-(--arvesta-gold)/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    {image && (
                      <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-(--arvesta-bg-card) to-transparent opacity-60" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-white transition-colors group-hover:text-(--arvesta-gold)">
                      {title}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-1 font-ui text-xs font-semibold uppercase tracking-[0.12em] text-(--arvesta-gold) transition-all group-hover:gap-2">
                      {t("viewProduct")} <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
