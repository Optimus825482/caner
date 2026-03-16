import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { generateAlternates } from "@/lib/seo";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Politique de Confidentialité — Arvesta Menuiserie France",
    description:
      "Politique de confidentialité et protection des données personnelles.",
  },
  en: {
    title: "Privacy Policy — Arvesta Menuiserie France",
    description: "Privacy policy and personal data protection.",
  },
  tr: {
    title: "Gizlilik Politikası — Arvesta Menuiserie France",
    description: "Gizlilik politikası ve kişisel verilerin korunması.",
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
    alternates: generateAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-24 pt-32">
      <div className="mx-auto max-w-[720px]">
        <Link
          href={`/${locale}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHome")}
        </Link>

        <h1 className="mb-8 font-display text-3xl font-bold text-white md:text-4xl">
          {t("title")}
        </h1>

        <p className="mb-4 text-xs text-(--arvesta-text-muted)">
          {t("lastUpdated")}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-(--arvesta-text-secondary)">
          <section>
            <h2 className="mb-3 font-ui text-lg font-semibold text-white">
              {t("s1Title")}
            </h2>
            <p>{t("s1Text")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-ui text-lg font-semibold text-white">
              {t("s2Title")}
            </h2>
            <p>{t("s2Text")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-ui text-lg font-semibold text-white">
              {t("s3Title")}
            </h2>
            <p>{t("s3Text")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-ui text-lg font-semibold text-white">
              {t("s4Title")}
            </h2>
            <p>{t("s4Text")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-ui text-lg font-semibold text-white">
              {t("s5Title")}
            </h2>
            <p>{t("s5Text")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-ui text-lg font-semibold text-white">
              {t("s6Title")}
            </h2>
            <p>{t("s6Text")}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
