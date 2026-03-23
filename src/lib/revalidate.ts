import { revalidatePath } from "next/cache";

/**
 * Revalidate all public pages that display catalog data
 * (categories, products, subcategories).
 * Call after any admin mutation on these entities.
 */
export function revalidateCatalogPages() {
  // Home page (Showcase + Collections sections)
  revalidatePath("/fr", "page");
  revalidatePath("/en", "page");
  revalidatePath("/tr", "page");

  // Collections detail pages
  revalidatePath("/fr/collections", "layout");
  revalidatePath("/en/collections", "layout");
  revalidatePath("/tr/collections", "layout");

  // Products pages
  revalidatePath("/fr/products", "page");
  revalidatePath("/en/products", "page");
  revalidatePath("/tr/products", "page");
}
