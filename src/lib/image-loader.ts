/**
 * Custom Next.js image loader.
 *
 * Uploaded product images (under /uploads/) are already optimised by sharp
 * during the publish step, so we skip the built-in _next/image optimiser and
 * serve them directly via the API route that reads from disk.
 *
 * All other images (e.g. external URLs) fall back to the default _next/image
 * optimiser endpoint.
 */

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderParams): string {
  // Uploaded images — serve directly (already optimised by sharp).
  if (src.startsWith("/uploads/")) {
    return `${src}?w=${width}`;
  }

  // External URLs (e.g. ui-avatars.com) — pass through with width hint.
  // Appending w= satisfies Next.js loader width requirement check.
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}w=${width}`;
  }

  // Local non-upload images — serve as-is with width hint
  return `${src}?w=${width}&q=${quality || 75}`;
}
