import type { Metadata } from "next";
import AboutClient from "@/components/public/AboutClient";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
} from "@/lib/seo";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "À Propos — Arvesta Menuiserie France",
    description:
      "Découvrez l'histoire d'Arvesta : savoir-faire artisanal d'Aksaray, design français, mobilier sur mesure livré en Europe.",
  },
  en: {
    title: "About — Arvesta Menuiserie France",
    description:
      "Discover the Arvesta story: artisan craftsmanship from Aksaray, French design, bespoke furniture delivered across Europe.",
  },
  tr: {
    title: "Hakkımızda — Arvesta Menuiserie France",
    description:
      "Arvesta'nın hikayesini keşfedin: Aksaray'dan zanaat ustalığı, Fransız tasarım, Avrupa'ya teslim özel mobilya.",
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
    alternates: generateAlternates(locale, "/about"),
    openGraph: generateOgMeta(locale, m.title, m.description, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const bc = breadcrumbJsonLd(locale, [
    { name: "Arvesta", url: "" },
    { name: meta[locale]?.title.split(" — ")[0] || "About" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />
      <AboutClient locale={locale} />
    </>
  );
}
