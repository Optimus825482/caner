import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/lib/seo";
import { prisma } from "@/lib/prisma";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Questions Fréquentes — Arvesta Menuiserie France",
    description:
      "Réponses à vos questions sur le mobilier sur mesure, les délais de livraison, les matériaux et le processus de commande chez Arvesta.",
  },
  en: {
    title: "Frequently Asked Questions — Arvesta Menuiserie France",
    description:
      "Answers to your questions about custom furniture, delivery times, materials and the ordering process at Arvesta.",
  },
  tr: {
    title: "Sıkça Sorulan Sorular — Arvesta Menuiserie France",
    description:
      "Özel mobilya, teslimat süreleri, malzemeler ve sipariş süreci hakkında sorularınızın yanıtları.",
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
    alternates: generateAlternates(locale, "/faq"),
    openGraph: generateOgMeta(locale, m.title, m.description, "/faq"),
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });

  // Fetch FAQ items from database
  const dbItems = (await (prisma as any).faqItem.findMany({
    where: { published: true },
    include: { translations: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })) as Array<{
    id: string;
    order: number;
    published: boolean;
    translations: Array<{ locale: string; question: string; answer: string }>;
  }>;

  // Build FAQ list: DB items first, then fallback to static i18n keys if DB is empty
  let faqs: { question: string; answer: string }[];

  if (dbItems.length > 0) {
    faqs = dbItems
      .map((item) => {
        const tr =
          item.translations.find((t) => t.locale === locale) ||
          item.translations.find((t) => t.locale === "fr") ||
          item.translations[0];
        if (!tr) return null;
        return { question: tr.question, answer: tr.answer };
      })
      .filter(Boolean) as { question: string; answer: string }[];
  } else {
    // Fallback to static i18n translations when no DB items exist
    const faqKeys = [
      "delivery",
      "countries",
      "process",
      "materials",
      "warranty",
      "payment",
      "timeline",
      "custom",
      "installation",
      "quote",
    ] as const;

    faqs = faqKeys.map((key) => ({
      question: t(`${key}Q` as Parameters<typeof t>[0]),
      answer: t(`${key}A` as Parameters<typeof t>[0]),
    }));
  }

  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: t("title") },
  ]);

  const faqSchema = faqJsonLd(faqs);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-[720px]">
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

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.015)] transition-colors open:border-(--arvesta-gold)/30"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 font-ui text-sm font-semibold text-white select-none">
                <span>{faq.question}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-(--arvesta-gold) transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5 text-sm leading-relaxed text-(--arvesta-text-secondary)">
                {faq.answer}
              </div>
            </details>
          ))}
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
      </div>
    </main>
  );
}
