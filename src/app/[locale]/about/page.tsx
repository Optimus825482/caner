import type { Metadata } from "next";
import AboutClient from "@/components/public/AboutClient";

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
    openGraph: {
      title: m.title,
      description: m.description,
      type: "website",
      locale: locale === "fr" ? "fr_FR" : locale === "tr" ? "tr_TR" : "en_US",
      siteName: "Arvesta Menuiserie France",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AboutClient locale={locale} />;
}
