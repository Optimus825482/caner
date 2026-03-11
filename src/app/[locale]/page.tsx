import type { Metadata } from "next";
import Hero from "@/components/public/Hero";
import Showcase from "@/components/public/Showcase";
import Collections from "@/components/public/Collections";
import ExportSection from "@/components/public/ExportSection";
import Marquee from "@/components/public/Marquee";
import ContactForm from "@/components/public/ContactForm";

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
    openGraph: {
      title: m.title,
      description: m.description,
      type: "website",
      locale: locale === "fr" ? "fr_FR" : locale === "tr" ? "tr_TR" : "en_US",
      siteName: "Arvesta Menuiserie France",
    },
  };
}

function JsonLd({ locale }: { locale: string }) {
  const m = meta[locale] || meta.fr;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: "Arvesta Menuiserie France",
    description: m.description,
    url: `https://arvesta-france.com/${locale}`,
    logo: "https://arvesta-france.com/uploads/products/logo.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Paris",
      postalCode: "75001",
      addressCountry: "FR",
    },
    areaServed: ["FR", "BE", "DE", "NL"],
    priceRange: "€€€",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="relative isolate overflow-x-clip">
      <JsonLd locale={locale} />
      <Hero locale={locale} />

      <div className="relative z-[1]">
        <Collections locale={locale} />
        <Showcase locale={locale} />
        <ExportSection locale={locale} />
        <Marquee />
        <ContactForm locale={locale} />
      </div>
    </div>
  );
}
