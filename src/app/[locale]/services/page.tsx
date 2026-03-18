import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import ServiceDetailDialog from "@/components/public/ServiceDetailDialog";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Nos Services — Arvesta Menuiserie France",
    description:
      "Conception sur mesure, livraison européenne, installation professionnelle et service après-vente.",
  },
  en: {
    title: "Our Services — Arvesta Menuiserie France",
    description:
      "Custom design, European delivery, professional installation and after-sales service.",
  },
  tr: {
    title: "Hizmetlerimiz — Arvesta Menuiserie France",
    description:
      "Özel tasarım, Avrupa teslimatı, profesyonel montaj ve satış sonrası hizmet.",
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
    alternates: generateAlternates(locale, "/services"),
    openGraph: generateOgMeta(locale, m.title, m.description, "/services"),
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesPage" });
  const faqT = await getTranslations({ locale, namespace: "faq" });

  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: t("title") },
  ]);

  // Fetch services from DB
  const dbServices = (await (prisma as any).serviceItem.findMany({
    where: { published: true },
    include: { translations: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })) as Array<{
    id: string;
    icon: string | null;
    order: number;
    translations: Array<{
      locale: string;
      title: string;
      summary: string;
      detail: string;
    }>;
  }>;

  const services = dbServices.map((item) => {
    const tr =
      item.translations.find((t) => t.locale === locale) ||
      item.translations.find((t) => t.locale === "fr") ||
      item.translations[0];
    return {
      id: item.id,
      icon: item.icon,
      title: tr?.title || "",
      summary: tr?.summary || "",
      detail: tr?.detail || "",
    };
  });

  // Fetch FAQ items from DB
  const dbFaqs = (await (prisma as any).faqItem.findMany({
    where: { published: true },
    include: { translations: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })) as Array<{
    id: string;
    translations: Array<{ locale: string; question: string; answer: string }>;
  }>;

  const faqs = dbFaqs
    .map((item) => {
      const tr =
        item.translations.find((t) => t.locale === locale) ||
        item.translations.find((t) => t.locale === "fr") ||
        item.translations[0];
      if (!tr) return null;
      return { question: tr.question, answer: tr.answer };
    })
    .filter(Boolean) as { question: string; answer: string }[];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-(--arvesta-text-secondary)">
            {t("subtitle")}
          </p>
        </div>

        {/* Services Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <ServiceDetailDialog
                key={svc.id}
                title={svc.title}
                summary={svc.summary}
                detail={svc.detail}
                icon={svc.icon}
              />
            ))}
          </div>
        ) : (
          /* Fallback to static i18n when no DB services */
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(
              [
                "customDesign",
                "materialSelection",
                "delivery",
                "installation",
                "warranty",
                "support",
              ] as const
            ).map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.015)] p-8 transition-all duration-300 hover:border-(--arvesta-gold)/40"
              >
                <h3 className="mb-3 font-display text-lg font-bold text-white">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-(--arvesta-text-secondary)">
                  {t(`${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        )}

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

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section id="faq" className="mt-24">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl">
                {faqT("title")}
              </h2>
              <p className="mx-auto max-w-2xl text-base text-(--arvesta-text-secondary)">
                {faqT("subtitle")}
              </p>
            </div>

            <div className="mx-auto max-w-[720px] space-y-4">
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
          </section>
        )}
      </div>
    </main>
  );
}
