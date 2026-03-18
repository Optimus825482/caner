/**
 * Generate a URL-friendly slug from text.
 * Handles French/Turkish accented characters.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-"); // collapse multiple hyphens
}

/**
 * Extract slug from translations array, auto-generating from FR title if not provided.
 */
export function resolveSlug(
  slug: string | undefined,
  translations: { locale: string; name?: string; title?: string }[],
): string {
  if (slug?.trim()) return slug.trim();
  const fr = translations.find((t) => t.locale === "fr");
  const source =
    fr?.name ||
    fr?.title ||
    translations[0]?.name ||
    translations[0]?.title ||
    "";
  return slugify(source);
}
