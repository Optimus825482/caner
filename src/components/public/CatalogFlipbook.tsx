"use client";

import React, { useRef, useState, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

function normalizeImageUrl(url: string): string {
  if (!url?.trim()) return "";
  const s = url.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"))
    return s;
  return `/${s}`;
}

const Page = React.forwardRef<
  HTMLDivElement,
  { imageUrl: string; number: number; t: (key: string, values?: Record<string, string | number>) => string }
>(({ imageUrl, number, t }, ref) => {
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
          alt={t("pageAlt", { n: number })}
          className="absolute inset-0 w-full h-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-(--arvesta-text-muted) text-sm">
          {t("noImage")}
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
  const t = useTranslations("catalog");
  const bookRef = useRef<{
    pageFlip: () => { flip: (p: number, c?: string) => void };
  } | null>(null);
  const pageRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = pages.length;
  const lastPage = Math.max(0, totalPages - 1);

  const onFlip = useCallback((e: { data?: number }) => {
    if (typeof e?.data === "number") {
      pageRef.current = e.data;
      setCurrentPage(e.data);
    }
  }, []);

  const goNext = () => {
    const pf = bookRef.current?.pageFlip();
    if (!pf) return;
    if (pageRef.current >= lastPage) return;
    pf.flip(pageRef.current + 1, "top");
  };
  const goPrev = () => {
    const pf = bookRef.current?.pageFlip();
    if (!pf) return;
    if (pageRef.current <= 0) return;
    pf.flip(pageRef.current - 1, "top");
  };

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-(--arvesta-text-muted)">
        <p>{t("noPages")}</p>
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
          aria-label={t("prev")}
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
            usePortrait={true}
            startPage={0}
            drawShadow={true}
            flippingTime={600}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            startZIndex={0}
            autoSize={false}
            maxShadowOpacity={0.5}
            clickEventForward={true}
            disableFlipByClick={false}
            className=""
            style={{}}
            onFlip={onFlip}
          >
            {pages.map((p, i) => (
              <Page key={p.id ?? `${p.imageUrl}-${i}`} imageUrl={p.imageUrl} number={i + 1} t={t} />
            ))}
          </HTMLFlipBook>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= pages.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-(--arvesta-bg-card) text-(--arvesta-gold) transition-all hover:bg-(--arvesta-gold)/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("next")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <p className="text-sm text-(--arvesta-text-muted)">
        {t("pageOf", { n: currentPage + 1, total: pages.length })}
      </p>
    </div>
  );
}
