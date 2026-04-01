import { revalidatePath, revalidateTag } from "next/cache";
import { routing } from "@/i18n/routing";
import { absolutePublicUrl } from "@/lib/seo";

const locales = routing.locales;

function pathFromAbsolute(locale: string, path: string): string {
  return new URL(absolutePublicUrl(locale, path)).pathname;
}

/** Cache tag used by about page data fetching */
export const ABOUT_SETTINGS_TAG = "about-settings";

/**
 * Revalidate all public pages that display catalog data
 * (categories, products, subcategories).
 * Call after any admin mutation on these entities.
 */
export function revalidateCatalogPages() {
  for (const locale of locales) {
    revalidatePath(pathFromAbsolute(locale, ""), "page");
    revalidatePath(pathFromAbsolute(locale, "/collections"), "layout");
    revalidatePath(pathFromAbsolute(locale, "/products"), "page");
  }
}

/**
 * Revalidate all public pages that display about/settings data.
 * Call after admin saves site settings.
 */
export function revalidateAboutPages() {
  // Tag-based revalidation — kesin cache invalidation
  revalidateTag(ABOUT_SETTINGS_TAG, { expire: 0 });

  // Path-based revalidation — full route cache temizliği
  for (const locale of locales) {
    revalidatePath(pathFromAbsolute(locale, "/about"), "page");
    revalidatePath(pathFromAbsolute(locale, ""), "page");
  }
}
