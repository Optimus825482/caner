import { revalidatePath, revalidateTag } from "next/cache";
import { routing } from "@/i18n/routing";

const locales = routing.locales;

/** Cache tag used by about page data fetching */
export const ABOUT_SETTINGS_TAG = "about-settings";

/**
 * Revalidate all public pages that display catalog data
 * (categories, products, subcategories).
 * Call after any admin mutation on these entities.
 */
export function revalidateCatalogPages() {
  for (const locale of locales) {
    revalidatePath(`/${locale}`, "page");
    revalidatePath(`/${locale}/collections`, "layout");
    revalidatePath(`/${locale}/products`, "page");
  }
}

/**
 * Revalidate all public pages that display about/settings data.
 * Call after admin saves site settings.
 */
export function revalidateAboutPages() {
  // Tag-based revalidation — kesin cache invalidation
  revalidateTag(ABOUT_SETTINGS_TAG);

  // Path-based revalidation — full route cache temizliği
  for (const locale of locales) {
    revalidatePath(`/${locale}/about`, "page");
    revalidatePath(`/${locale}`, "page");
  }
}
