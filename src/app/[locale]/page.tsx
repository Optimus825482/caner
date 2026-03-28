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
  websiteJsonLd,
} from "@/lib/seo";

const meta: Record<string, { title: string; description: string; h1: string }> =
  {
    fr: {
      title: "Arvesta Menuiserie France — Mobilier Sur Mesure Premium",
      description:
        "Cuisines, dressings, salles de bains et projets sur mesure de haute qualité. Fabriqué en Turquie, livré en Europe. Devis gratuit.",
      h1: "Arvesta — Mobilier Sur Mesure Premium, Cuisines et Dressings",
    },
    en: {
      title: "Arvesta Menuiserie France — Premium Custom Furniture",
      description:
        "High-quality custom kitchens, wardrobes, bathrooms and bespoke projects. Made in Turkey, delivered across Europe. Free quote.",
      h1: "Arvesta — Premium Custom Furniture, Kitchens and Wardrobes",
    },
    tr: {
      title: "Arvesta Menuiserie France — Premium Özel Tasarım Mobilya",
      description:
        "Yüksek kaliteli özel tasarım mutfak, gardırop, banyo ve kişiye özel projeler. Türkiye'de üretilir, Avrupa'ya teslim edilir.",
      h1: "Arvesta — Premium Özel Tasarım Mobilya, Mutfak ve Gardırop",
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
  const site = websiteJsonLd();

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }}
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
    <div className="relative isolate">
      <h1 className="sr-only">{(meta[locale] || meta.fr).h1}</h1>
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
