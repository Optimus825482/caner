import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://arvestafrance.com";

const LOCALES = routing.locales;
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
  const canonical = `${SITE_URL}/${locale}${path}`;
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/fr${path}`;
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
    url: `${SITE_URL}/${locale}${path}`,
    ...(images && images.length > 0 ? { images } : {}),
  };
}

/**
 * WebSite JSON-LD for root layout.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Arvesta Menuiserie France",
    url: SITE_URL,
    inLanguage: ["fr", "en", "tr"],
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
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: ["https://www.instagram.com/arvestamenuiserie"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@arvestafrance.com",
      availableLanguage: ["French", "English", "Turkish"],
    },
  };
}

/**
 * BreadcrumbList JSON-LD.
 * Google requires "item" (URL) on every ListItem except the last one.
 * When url is "" or omitted on the first item, we default to the locale homepage.
 */
export function breadcrumbJsonLd(
  locale: string,
  items: Array<{ name: string; url?: string }>,
) {
  const lastIndex = items.length - 1;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const isLast = index === lastIndex;
      // Resolve URL: empty string → locale homepage, undefined on last item → omit
      let itemUrl: string | undefined;
      if (item.url !== undefined) {
        itemUrl =
          item.url === ""
            ? `${SITE_URL}/${locale}`
            : `${SITE_URL}/${locale}${item.url}`;
      } else if (!isLast) {
        // Non-last items MUST have a URL per Google spec — fallback to homepage
        itemUrl = `${SITE_URL}/${locale}`;
      }

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(itemUrl ? { item: itemUrl } : {}),
      };
    }),
  };
}

/**
 * Product JSON-LD for product detail pages.
 * Note: Offer removed — sur mesure products have no fixed price.
 * Google invalidates Offer schema with price "0".
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
    url: `${SITE_URL}/${locale}/products/${product.slug}`,
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
    url: `${SITE_URL}/${locale}/collections/${collection.slug}`,
    ...(collection.image ? { image: collection.image } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Arvesta Menuiserie France",
      url: SITE_URL,
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
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/image.png`,
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
    email: "contact@arvestafrance.com",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
    currenciesAccepted: "EUR",
    sameAs: ["https://www.instagram.com/arvestamenuiserie"],
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

/**
 * Service JSON-LD for services page.
 */
export function serviceJsonLd(
  services: Array<{ name: string; description: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: "Arvesta Menuiserie France",
    url: SITE_URL,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((svc) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: svc.name,
          description: svc.description,
          provider: {
            "@type": "Organization",
            name: "Arvesta Menuiserie France",
          },
          areaServed: [
            { "@type": "Country", name: "France" },
            { "@type": "Country", name: "Belgium" },
            { "@type": "Country", name: "Germany" },
            { "@type": "Country", name: "Netherlands" },
          ],
        },
      })),
    },
  };
}

/**
 * AboutPage JSON-LD — E-E-A-T signal for about page.
 */
export function aboutPageJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "À Propos — Arvesta Menuiserie France",
    url: `${SITE_URL}/${locale}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
      url: SITE_URL,
      foundingLocation: {
        "@type": "Place",
        name: "Aksaray, Türkiye",
      },
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "Belgium" },
        { "@type": "Country", name: "Germany" },
        { "@type": "Country", name: "Netherlands" },
      ],
      knowsAbout: [
        "Menuiserie sur mesure",
        "Cuisine sur mesure",
        "Mobilier premium",
        "Dressing sur mesure",
      ],
    },
  };
}

/**
 * Blog JSON-LD for blog listing page.
 */
export function blogListJsonLd(
  locale: string,
  posts: Array<{
    title: string;
    url: string;
    date: string;
    excerpt?: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog & Inspirations — Arvesta",
    url: `${SITE_URL}/${locale}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: post.url,
      datePublished: post.date,
      ...(post.excerpt ? { description: post.excerpt } : {}),
      author: {
        "@type": "Organization",
        name: "Arvesta Menuiserie France",
      },
    })),
  };
}

/**
 * ItemList JSON-LD for product listing pages.
 */
export function productListJsonLd(
  locale: string,
  products: Array<{ name: string; url: string; image?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nos Produits — Arvesta",
    url: `${SITE_URL}/${locale}/products`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: p.url,
      ...(p.image ? { image: p.image } : {}),
    })),
  };
}
