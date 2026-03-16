import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
} from "@/lib/seo";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Blog & Inspirations — Arvesta Menuiserie France",
    description:
      "Découvrez nos articles d'inspiration, tendances mobilier et conseils d'aménagement intérieur par Arvesta.",
  },
  en: {
    title: "Blog & Inspirations — Arvesta Menuiserie France",
    description:
      "Discover our inspiration articles, furniture trends and interior design tips by Arvesta.",
  },
  tr: {
    title: "Blog & İlham — Arvesta Menuiserie France",
    description:
      "Arvesta'dan ilham yazıları, mobilya trendleri ve iç mekan tasarım ipuçları keşfedin.",
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
    alternates: generateAlternates(locale, "/blog"),
    openGraph: generateOgMeta(locale, m.title, m.description, "/blog"),
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    include: { translations: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: t("title") },
  ]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />

      <div className="mx-auto max-w-[960px]">
        <Link
          href={`/${locale}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHome")}
        </Link>

        <h1 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl">
          {t("title")}
        </h1>
        <p className="mb-12 text-base text-(--arvesta-text-secondary)">
          {t("subtitle")}
        </p>

        {posts.length === 0 ? (
          <p className="text-center text-(--arvesta-text-secondary) py-16">
            {t("noPosts")}
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const tr =
                post.translations.find((t) => t.locale === locale) ||
                post.translations.find((t) => t.locale === "fr") ||
                post.translations[0];

              return (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group overflow-hidden rounded-2xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.015)] transition-all hover:border-(--arvesta-gold)/30 hover:-translate-y-1"
                >
                  {post.image ? (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.image}
                        alt={tr?.title || ""}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-zinc-800/50">
                      <span className="text-3xl text-zinc-600">✦</span>
                    </div>
                  )}
                  <div className="p-5">
                    <time className="mb-2 block text-xs text-(--arvesta-text-muted)">
                      {new Date(post.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <h2 className="mb-2 font-display text-lg font-bold text-white group-hover:text-(--arvesta-gold) transition-colors">
                      {tr?.title || post.slug}
                    </h2>
                    {tr?.excerpt && (
                      <p className="text-sm leading-relaxed text-(--arvesta-text-secondary) line-clamp-3">
                        {tr.excerpt}
                      </p>
                    )}
                    <span className="mt-3 inline-block text-sm font-medium text-(--arvesta-gold)">
                      {t("readMore")} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
