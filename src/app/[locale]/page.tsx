import type { Metadata } from "next";
import Hero from "@/components/public/Hero";
import Showcase from "@/components/public/Showcase";
import Collections from "@/components/public/Collections";
import ExportSection from "@/components/public/ExportSection";
import Marquee from "@/components/public/Marquee";
import ContactForm from "@/components/public/ContactForm";
import { getPublicSettings } from "@/lib/get-public-settings";
import { prisma } from "@/lib/prisma";
import {
  generateAlternates,
  generateOgMeta,
  furnitureStoreJsonLd,
  organizationJsonLd,
} from "@/lib/seo";

const meta: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Arvesta Menuiserie France — Mobilier Sur Mesure Premium",
    description:
      "Cuisines, dressings, salles de bains et projets sur mesure de haute qualité. Fabriqué en Turquie, livré en Europe. Devis gratuit.",
  },
  en: {
    title: "Arvesta Menuiserie France — Premium Custom Furniture",
    description:
      "High-quality custom kitchens, wardrobes, bathrooms and bespoke projects. Made in Turkey, delivered across Europe. Free quote.",
  },
  tr: {
    title: "Arvesta Menuiserie France — Premium Özel Tasarım Mobilya",
    description:
      "Yüksek kaliteli özel tasarım mutfak, gardırop, banyo ve kişiye özel projeler. Türkiye'de üretilir, Avrupa'ya teslim edilir.",
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
    alternates: generateAlternates(locale),
    openGraph: generateOgMeta(locale, m.title, m.description),
  };
}

function JsonLd({ locale }: { locale: string }) {
  const m = meta[locale] || meta.fr;
  const store = furnitureStoreJsonLd(locale, m.description);
  const org = organizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(store) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
    </>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [settings, categories] = await Promise.all([
    getPublicSettings(),
    prisma.category.findMany({
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const categoryOptions = categories.map((cat) => {
    const tr =
      cat.translations.find((t) => t.locale === locale) ?? cat.translations[0];
    return { value: cat.slug, label: tr?.name ?? cat.slug };
  });

  return (
    <div className="relative isolate overflow-x-clip">
      <JsonLd locale={locale} />
      <Hero locale={locale} />

      <div className="relative z-1">
        <Collections locale={locale} />
        <Showcase locale={locale} />
        <ExportSection locale={locale} />
        <Marquee />
        <ContactForm
          locale={locale}
          categories={categoryOptions}
          settings={{
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
          }}
        />
      </div>
    </div>
  );
}
