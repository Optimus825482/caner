"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CatalogFullscreenModal } from "./CatalogFullscreenModal";

function normalizeImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const s = url.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  return `/${s}`;
}

interface Catalog {
  id: string;
  slug: string;
  translations: { locale: string; title: string }[];
  coverImage: string | null;
  pages: { imageUrl: string }[];
}

interface Props {
  catalogs: Catalog[];
  locale: string;
  title: string;
}

export function ProductsCatalogSection({
  catalogs,
  locale,
  title,
}: Props) {
  const [fullscreenSlug, setFullscreenSlug] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  function handleCatalogClick(slug: string) {
    if (isDesktop) {
      setFullscreenSlug(slug);
    } else {
      router.push(`/${locale}/catalog/${slug}`);
    }
  }

  if (catalogs.length === 0) return null;

  return (
    <>
      <div className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-white">
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((cat) => {
            const catTitle = cat.translations[0]?.title || cat.slug;
            const coverUrl = normalizeImageUrl(cat.coverImage || cat.pages[0]?.imageUrl);

            return (
              <button
                key={cat.id}
                type="button"
                className="block w-full text-left"
                onClick={() => handleCatalogClick(cat.slug)}
              >
                <div className="group overflow-hidden rounded-2xl border border-(--arvesta-gold)/15 bg-(--arvesta-bg-card) transition-all duration-500 hover:-translate-y-1 hover:border-(--arvesta-gold)/40 cursor-pointer">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={catTitle}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-white/5">
                        <span className="text-(--arvesta-text-muted) text-sm">
                          {catTitle}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white font-display font-semibold">
                      {catTitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <CatalogFullscreenModal
        slug={fullscreenSlug || ""}
        locale={locale}
        open={!!fullscreenSlug}
        onClose={() => setFullscreenSlug(null)}
      />
    </>
  );
}
