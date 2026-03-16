import type { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arvesta-france.com";

const LOCALES = ["fr", "en", "tr"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_MAP: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  tr: "tr_TR",
};

/**
 * Generate alternates (hreflang + canonical) for a given path.
 * path should NOT include the locale prefix, e.g. "/about" or "/products/my-slug"
 */
export function generateAlternates(
  locale: string,
  path: string = "",
): Metadata["alternates"] {
  const canonical = `${BASE_URL}/${locale}${path}`;
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/fr${path}`;
  return { canonical, languages };
}

/**
 * Generate OpenGraph metadata with locale alternates.
 */
export function generateOgMeta(
  locale: string,
  title: string,
  description: string,
  path: string = "",
  images?: string[],
) {
  const ogLocale = LOCALE_MAP[locale as Locale] || "fr_FR";
  const alternateLocales = LOCALES.filter((l) => l !== locale).map(
    (l) => LOCALE_MAP[l],
  );
  return {
    title,
    description,
    type: "website" as const,
    locale: ogLocale,
    alternateLocale: alternateLocales,
    siteName: "Arvesta Menuiserie France",
    url: `${BASE_URL}/${locale}${path}`,
    ...(images && images.length > 0 ? { images } : {}),
  };
}

/**
 * WebSite JSON-LD for root layout (sitelinks search box).
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Arvesta Menuiserie France",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/fr/collections/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Organization JSON-LD.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Arvesta Menuiserie France",
    url: BASE_URL,
    logo: `${BASE_URL}/uploads/products/logo.png`,
    sameAs: ["https://instagram.com/arvesta"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["French", "English", "Turkish"],
    },
  };
}

/**
 * BreadcrumbList JSON-LD.
 */
export function breadcrumbJsonLd(
  locale: string,
  items: Array<{ name: string; url?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${BASE_URL}/${locale}${item.url}` } : {}),
    })),
  };
}

/**
 * Product JSON-LD for product detail pages.
 */
export function productJsonLd(
  locale: string,
  product: {
    name: string;
    description: string;
    slug: string;
    image?: string;
    category?: string;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${BASE_URL}/${locale}/products/${product.slug}`,
    ...(product.image ? { image: product.image } : {}),
    ...(product.category ? { category: product.category } : {}),
    brand: {
      "@type": "Brand",
      name: "Arvesta",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "EUR",
      price: "0",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      url: `${BASE_URL}/${locale}/products/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: "Arvesta Menuiserie France",
      },
    },
  };
}

/**
 * CollectionPage JSON-LD for category pages.
 */
export function collectionJsonLd(
  locale: string,
  collection: {
    name: string;
    description: string;
    slug: string;
    image?: string;
    productCount: number;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: `${BASE_URL}/${locale}/collections/${collection.slug}`,
    ...(collection.image ? { image: collection.image } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Arvesta Menuiserie France",
      url: BASE_URL,
    },
    numberOfItems: collection.productCount,
  };
}

/**
 * FurnitureStore JSON-LD (enhanced version for home page).
 */
export function furnitureStoreJsonLd(locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: "Arvesta Menuiserie France",
    description,
    url: `${BASE_URL}/${locale}`,
    logo: `${BASE_URL}/uploads/products/logo.png`,
    image: `${BASE_URL}/image.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Paris",
      postalCode: "75001",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    areaServed: [
      { "@type": "Country", name: "France" },
      { "@type": "Country", name: "Belgium" },
      { "@type": "Country", name: "Germany" },
      { "@type": "Country", name: "Netherlands" },
    ],
    priceRange: "€€€",
    knowsLanguage: ["fr", "en", "tr"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Mobilier Sur Mesure",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Cuisines" },
        { "@type": "OfferCatalog", name: "Dressings" },
        { "@type": "OfferCatalog", name: "Salles de Bains" },
      ],
    },
  };
}

/**
 * FAQPage JSON-LD for FAQ pages — enables Google FAQ rich snippets.
 */
export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
