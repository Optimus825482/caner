import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import AboutClient from "@/components/public/AboutClient";
import {
  generateAlternates,
  generateOgMeta,
  breadcrumbJsonLd,
  aboutPageJsonLd,
} from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { ABOUT_SETTINGS_TAG } from "@/lib/revalidate";

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

  // Fetch about_* settings from DB — tag-based cache ile revalidation garantili
  const getAboutSettings = unstable_cache(
    async () => {
      const aboutRows = await prisma.siteSetting.findMany({
        where: { key: { startsWith: "about_" } },
      });
      const settings: Record<string, string> = {};
      for (const row of aboutRows) {
        if (row.value) settings[row.key] = row.value;
      }
      return settings;
    },
    ["about-settings"],
    { tags: [ABOUT_SETTINGS_TAG] },
  );
  const aboutSettings = await getAboutSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutPageJsonLd(locale)),
        }}
      />
      <AboutClient locale={locale} settings={aboutSettings} />
    </>
  );
}
