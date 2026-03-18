"use client";

import React, { useRef, useState, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";

function normalizeImageUrl(url: string): string {
  if (!url?.trim()) return "";
  const s = url.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"))
    return s;
  return `/${s}`;
}

const Page = React.forwardRef<
  HTMLDivElement,
  { imageUrl: string; number: number }
>(({ imageUrl, number }, ref) => {
  const src = normalizeImageUrl(imageUrl);
  return (
    <div
      ref={ref}
      className="relative w-full h-full min-h-[300px] bg-[#1a1a1a] overflow-hidden"
      style={{ minWidth: 200 }}
    >
      {src ? (
        <img
          src={src}
          alt={`Sayfa ${number}`}
          className="absolute inset-0 w-full h-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-(--arvesta-text-muted) text-sm">
          Görsel yok
        </div>
      )}
    </div>
  );
});

Page.displayName = "Page";

interface CatalogPage {
  imageUrl: string;
  id?: string;
  order?: number;
  catalogId?: string;
}

interface Props {
  pages: CatalogPage[];
  title?: string;
}

export function CatalogFlipbook({ pages, title }: Props) {
  const bookRef = useRef<{
    pageFlip: () => { flip: (p: number, c?: string) => void };
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const onFlip = useCallback((e: { data?: number }) => {
    if (typeof e?.data === "number") setCurrentPage(e.data);
  }, []);

  const goNext = () => {
    const pf = bookRef.current?.pageFlip();
    if (pf && currentPage < pages.length - 1) pf.flip(currentPage + 1, "top");
  };
  const goPrev = () => {
    const pf = bookRef.current?.pageFlip();
    if (pf && currentPage > 0) pf.flip(currentPage - 1, "top");
  };

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-(--arvesta-text-muted)">
        <p>Bu katalogda henüz sayfa yok.</p>
      </div>
    );
  }

  const bookWidth = 400;
  const bookHeight = 550;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {title && (
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
      )}

      <div className="relative flex items-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPage <= 0}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-(--arvesta-bg-card) text-(--arvesta-gold) transition-all hover:bg-(--arvesta-gold)/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className="overflow-hidden rounded-lg shadow-2xl"
          style={{
            width: bookWidth,
            height: bookHeight,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          }}
        >
          <HTMLFlipBook
            ref={bookRef}
            width={bookWidth}
            height={bookHeight}
            size="fixed"
            minWidth={200}
            maxWidth={500}
            minHeight={300}
            maxHeight={700}
            showCover={true}
            mobileScrollSupport={false}
            usePortrait={false}
            startPage={0}
            drawShadow={true}
            flippingTime={600}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            className=""
            style={{}}
            onFlip={onFlip}
          >
            {pages.map((p, i) => (
              <Page key={p.imageUrl} imageUrl={p.imageUrl} number={i + 1} />
            ))}
          </HTMLFlipBook>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= pages.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-(--arvesta-bg-card) text-(--arvesta-gold) transition-all hover:bg-(--arvesta-gold)/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <p className="text-sm text-(--arvesta-text-muted)">
        Sayfa {currentPage + 1} / {pages.length}
      </p>
    </div>
  );
}
