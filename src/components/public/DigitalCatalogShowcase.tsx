"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface PageItem {
  imageUrl: string;
}

interface Props {
  pages: PageItem[];
  title?: string;
  className?: string;
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const s = url.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"))
    return s;
  return `/${s}`;
}

export function DigitalCatalogShowcase({ pages, title, className = "" }: Props) {
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = pages.length;
  const hasPrev = idx > 0;
  const hasNext = idx < total - 1;

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= total) return;
      setIdx(i);
    },
    [total],
  );

  // Keyboard nav
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(idx - 1);
      if (e.key === "ArrowRight") go(idx + 1);
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [idx, go]);

  if (total === 0) return null;

  const page = pages[idx];
  const src = normalizeUrl(page?.imageUrl);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`group relative mx-auto w-full max-w-2xl outline-none ${className}`}
    >
      {/* Title */}
      {title && (
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-(--arvesta-gold)" />
          <h3 className="font-display text-lg font-semibold text-white">
            {title}
          </h3>
        </div>
      )}

      {/* Book container */}
      <div className="relative overflow-hidden rounded-2xl border border-(--arvesta-gold)/15 bg-[#1a1a1a] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        {/* Page area */}
        <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
          {/* Page image */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              key={idx}
              src={src}
              alt={`${title || "Katalog"} — Sayfa ${idx + 1}`}
              className="h-full w-full animate-in fade-in zoom-in-95 object-contain duration-300"
              style={{ viewTransitionName: "catalog-page" }}
              loading="eager"
            />
          </div>

          {/* Shadow overlay for depth */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black/30 to-transparent" />

          {/* Gradient bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/50 to-transparent" />

          {/* Page number badge */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
            {idx + 1} / {total}
          </div>

          {/* Left/Right nav arrows */}
          <button
            type="button"
            onClick={() => go(idx - 1)}
            disabled={!hasPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all hover:bg-black/70 group-hover:opacity-100 disabled:opacity-0"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(idx + 1)}
            disabled={!hasNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all hover:bg-black/70 group-hover:opacity-100 disabled:opacity-0"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Click zones */}
          <button
            type="button"
            onClick={() => go(idx - 1)}
            disabled={!hasPrev}
            className="absolute left-0 top-0 h-full w-1/3 cursor-pointer disabled:cursor-default"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => go(idx + 1)}
            disabled={!hasNext}
            className="absolute right-0 top-0 h-full w-1/3 cursor-pointer disabled:cursor-default"
            aria-hidden="true"
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between border-t border-white/5 bg-(--arvesta-bg-card) px-4 py-3">
          <button
            type="button"
            onClick={() => go(idx - 1)}
            disabled={!hasPrev}
            className="flex items-center gap-1 text-sm font-medium text-(--arvesta-text-muted) transition-colors hover:text-(--arvesta-gold) disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Önceki</span>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {pages.slice(0, Math.min(total, 20)).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx
                    ? "w-5 bg-(--arvesta-gold)"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Sayfa ${i + 1}`}
              />
            ))}
            {total > 20 && (
              <span className="ml-1 text-[10px] text-(--arvesta-text-muted)">
                +{total - 20}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => go(idx + 1)}
            disabled={!hasNext}
            className="flex items-center gap-1 text-sm font-medium text-(--arvesta-text-muted) transition-colors hover:text-(--arvesta-gold) disabled:opacity-30"
          >
            <span className="hidden sm:inline">Sonraki</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
