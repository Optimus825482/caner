import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { translations: true },
  });

  if (!post || !post.published) {
    return { title: "Not Found" };
  }

  const tr =
    post.translations.find((tx: { locale: string }) => tx.locale === locale) ||
    post.translations.find((tx: { locale: string }) => tx.locale === "fr") ||
    post.translations[0];

  const title = tr?.title || post.slug;
  const description = tr?.excerpt || "";

  return {
    title: `${title} — Arvesta`,
    description,
    alternates: generateAlternates(locale, `/blog/${slug}`),
    openGraph: generateOgMeta(locale, title, description, `/blog/${slug}`),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { translations: true },
  });

  if (!post || !post.published) {
    notFound();
  }

  const tr =
    post.translations.find((tx: { locale: string }) => tx.locale === locale) ||
    post.translations.find((tx: { locale: string }) => tx.locale === "fr") ||
    post.translations[0];

  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: t("title"), url: "/blog" },
    { name: tr?.title || post.slug },
  ]);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tr?.title || post.slug,
    description: tr?.excerpt || "",
    image: post.image || undefined,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
    },
    publisher: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://arvesta-france.com"}/uploads/products/logo.png`,
      },
    },
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="mx-auto max-w-[720px]">
        <Link
          href={`/${locale}/blog`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        <time className="mb-3 block text-sm text-(--arvesta-text-muted)">
          {new Date(post.createdAt).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>

        <h1 className="mb-6 font-display text-3xl font-bold text-white md:text-4xl">
          {tr?.title || post.slug}
        </h1>

        {tr?.excerpt && (
          <p className="mb-8 text-lg leading-relaxed text-(--arvesta-text-secondary) italic">
            {tr.excerpt}
          </p>
        )}

        {post.image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-(--arvesta-gold)/15">
            <Image
              src={post.image}
              alt={tr?.title || ""}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose-arvesta text-base leading-relaxed text-(--arvesta-text-secondary) whitespace-pre-line">
          {tr?.content}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-(--arvesta-gold)/20 bg-[rgba(255,255,255,0.02)] p-8 text-center">
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
      </article>
    </main>
  );
}
