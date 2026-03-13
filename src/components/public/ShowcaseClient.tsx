"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import ImageShimmer from "@/components/public/ImageShimmer";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useScrollReveal";

interface Category {
  slug: string;
  name: string;
}
interface Product {
  id: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  description: string;
  image: string;
  featured: boolean;
}

export default function ShowcaseClient({
  categories,
  products,
}: {
  categories: Category[];
    products: Product[];
}) {
  const t = useTranslations();
  const [filter, setFilter] = useState("all");
  const [lightboxProductId, setLightboxProductId] = useState<string | null>(null);

  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: filterRef, isVisible: filterVisible } = useScrollReveal();
  const {
    ref: gridRef,
    isVisible: gridVisible,
    getDelay,
  } = useStaggerReveal(products.length, 90, 540);

  const filtered =
    filter === "all"
      ? products
      : products.filter((p) => p.categorySlug === filter);

  const lightboxIndex = lightboxProductId
    ? filtered.findIndex((p) => p.id === lightboxProductId)
    : -1;
  const activeLightboxItem = lightboxIndex >= 0 ? filtered[lightboxIndex] : null;

  const openLightbox = useCallback((i: number) => {
    const item = filtered[i];
    if (!item) return;
    setLightboxProductId(item.id);
    document.body.style.overflow = "hidden";
  }, [filtered]);

  const closeLightbox = useCallback(() => {
    setLightboxProductId(null);
    document.body.style.overflow = "";
  }, []);

  const prevItem = useCallback(
    () => {
      if (!filtered.length || lightboxIndex < 0) return;
      const nextIndex = (lightboxIndex - 1 + filtered.length) % filtered.length;
      setLightboxProductId(filtered[nextIndex]?.id ?? null);
    },
    [filtered, lightboxIndex],
  );

  const nextItem = useCallback(
    () => {
      if (!filtered.length || lightboxIndex < 0) return;
      const nextIndex = (lightboxIndex + 1) % filtered.length;
      setLightboxProductId(filtered[nextIndex]?.id ?? null);
    },
    [filtered, lightboxIndex],
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxProductId === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevItem();
      else if (e.key === "ArrowRight") nextItem();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxProductId, closeLightbox, prevItem, nextItem]);

  return (
    <>
      <section
        className="relative mx-auto max-w-7xl px-4 py-24 md:py-28"
        id="collections"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(200,168,110,0.18),transparent_38%),radial-gradient(circle_at_85%_85%,rgba(8,16,34,0.66),transparent_46%)]" />

        <div ref={headerRef} className="mb-12 text-center md:mb-16">
          <span
            className={`mb-3 block font-ui text-xs font-bold uppercase tracking-[0.24em] text-[var(--arvesta-gold)]/95 ${headerVisible ? "anim-title-reveal" : "opacity-0"}`}
          >
            {t("showcase.tag")}
          </span>
          <h2
            className={`mb-5 font-display text-4xl font-bold leading-tight text-white md:text-5xl ${headerVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            {t("showcase.title")}
          </h2>
          <div
            className={`mx-auto h-px w-24 bg-gradient-to-r from-transparent via-[var(--arvesta-gold)]/80 to-transparent ${headerVisible ? "anim-line-expand" : "opacity-0 scale-x-0"}`}
            style={{ animationDelay: "0.25s" }}
          />
          <p
            className={`mx-auto mt-6 max-w-[680px] text-base leading-relaxed text-[var(--arvesta-text-secondary)] md:text-[1.02rem] ${headerVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            {t("showcase.desc")}
          </p>
        </div>

        <div
          ref={filterRef}
          className={`mb-10 flex flex-wrap justify-center gap-2.5 md:mb-12 ${filterVisible ? "anim-reveal-up" : "opacity-0"}`}
          style={{ animationDelay: "0.15s" }}
        >
          <button
            onClick={() => {
              setFilter("all");
              closeLightbox();
            }}
            className={`rounded-full border px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1d] ${
              filter === "all"
                ? "border-[var(--arvesta-gold)] bg-[linear-gradient(135deg,rgba(200,168,110,0.26),rgba(200,168,110,0.1))] text-[var(--arvesta-gold)]"
                : "border-[var(--arvesta-gold)]/25 bg-[rgba(255,255,255,0.02)] text-white/80 hover:border-[var(--arvesta-gold)]/70 hover:bg-[rgba(200,168,110,0.09)] hover:text-[var(--arvesta-gold)]"
            }`}
          >
            {t("filter.all")}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setFilter(cat.slug);
                closeLightbox();
              }}
              className={`rounded-full border px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1d] ${
                filter === cat.slug
                  ? "border-[var(--arvesta-gold)] bg-[linear-gradient(135deg,rgba(200,168,110,0.26),rgba(200,168,110,0.1))] text-[var(--arvesta-gold)]"
                  : "border-[var(--arvesta-gold)]/25 bg-[rgba(255,255,255,0.02)] text-white/80 hover:border-[var(--arvesta-gold)]/70 hover:bg-[rgba(200,168,110,0.09)] hover:text-[var(--arvesta-gold)]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 md:grid-cols-12 md:auto-rows-[190px] md:gap-7"
        >
          {filtered.map((item, i) => (
            <button
              type="button"
              key={item.id}
              onClick={() => openLightbox(i)}
              aria-label={`Open gallery image: ${item.title}`}
              className={`tilt-card group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-3xl border border-[var(--arvesta-gold)]/22 text-left shadow-[0_20px_46px_rgba(2,8,20,0.48)] transition-all duration-500 hover:border-[var(--arvesta-gold)]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/85 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1d] md:aspect-auto ${
                item.featured
                  ? "md:col-span-8 md:row-span-2"
                  : i % 3 === 0
                    ? "md:col-span-4 md:row-span-2"
                    : "md:col-span-4 md:row-span-1"
              } ${gridVisible ? "anim-reveal-scale" : "opacity-0"}`}
              style={{ animationDelay: `${getDelay(i)}ms` }}
            >
              <ImageShimmer
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030916]/95 via-[#030916]/34 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(200,168,110,0.24),transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="absolute bottom-6 left-6 right-6">
                <span className="mb-2 block font-ui text-xs font-bold uppercase tracking-[0.16em] text-[var(--arvesta-gold)]">
                  {item.categoryName}
                </span>
                <h3 className="font-display text-2xl font-bold leading-tight text-white md:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-2 hidden max-w-md text-sm leading-relaxed text-white/80 sm:block">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {lightboxProductId !== null && activeLightboxItem && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-[#02050c]/95 px-3 pb-4 pt-24 md:px-6 md:pt-28"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Product image lightbox"
        >
          <button
            onClick={closeLightbox}
            aria-label="Close lightbox"
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--arvesta-gold)]/25 bg-[rgba(7,16,37,0.76)] text-[var(--arvesta-text-secondary)] transition-all hover:rotate-90 hover:border-[var(--arvesta-gold)]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/85 md:right-5"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevItem();
            }}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--arvesta-gold)]/25 bg-[#071026]/80 text-[var(--arvesta-text-secondary)] transition-all hover:border-[var(--arvesta-gold)] hover:text-[var(--arvesta-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/85 md:left-5 md:h-12 md:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextItem();
            }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--arvesta-gold)]/25 bg-[#071026]/80 text-[var(--arvesta-text-secondary)] transition-all hover:border-[var(--arvesta-gold)] hover:text-[var(--arvesta-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/85 md:right-5 md:h-12 md:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            className="max-h-[calc(100vh-9rem)] max-w-[96vw] rounded-2xl border border-[var(--arvesta-gold)]/32 bg-[linear-gradient(155deg,rgba(5,11,24,0.92),rgba(6,14,30,0.84))] p-3 text-center backdrop-blur-sm md:max-h-[85vh] md:max-w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeLightboxItem.image || ""}
              alt={activeLightboxItem.title || ""}
              width={1200}
              height={800}
              className="mx-auto max-h-[calc(100vh-14rem)] w-auto rounded-xl object-contain md:max-h-[75vh]"
            />
            <div className="mt-4 pb-1">
              <h3 className="mb-1 font-display text-xl text-white">
                {activeLightboxItem.title}
              </h3>
              <p className="text-sm text-[var(--arvesta-text-secondary)]">
                {activeLightboxItem.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
