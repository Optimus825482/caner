import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

const locales = routing.locales;

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
  for (const locale of locales) {
    revalidatePath(`/${locale}/about`, "page");
    revalidatePath(`/${locale}`, "page");
  }
}
