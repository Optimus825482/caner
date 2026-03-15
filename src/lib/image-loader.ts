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
  // Uploaded images — serve directly (already optimised by sharp)
  if (src.startsWith("/uploads/")) {
    return src;
  }

  // Default: use Next.js built-in optimiser
  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", String(width));
  params.set("q", String(quality || 75));
  return `/_next/image?${params.toString()}`;
}
