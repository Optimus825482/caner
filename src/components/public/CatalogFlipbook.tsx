"use client";

import React, { useRef, useState, memo } from "react";
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

interface FlipBookAPI {
  pageFlip: () => {
    flip: (p: number, c?: string) => void;
    flipNext: () => void;
    flipPrev: () => void;
  };
}

// Memoized so HTMLFlipBook never re-renders on parent state changes.
// That prevents the setState->re-render->library-reset->rAF storm that breaks flips.
const FlipBookInner = memo(function FlipBookInner({
  pages,
  bookRef,
  width,
  height,
}: {
  pages: CatalogPage[];
  bookRef: React.RefObject<FlipBookAPI | null>;
  width: number;
  height: number;
}) {
  const t = useTranslations("catalog");
  return (
    <HTMLFlipBook
      ref={bookRef as React.RefObject<unknown>}
      width={width}
      height={height}
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
    >
      {pages.map((p, i) => (
        <Page key={p.id ?? `${p.imageUrl}-${i}`} imageUrl={p.imageUrl} number={i + 1} t={t} />
      ))}
    </HTMLFlipBook>
  );
});

export function CatalogFlipbook({ pages, title }: Props) {
  const t = useTranslations("catalog");
  const bookRef = useRef<FlipBookAPI | null>(null);
  const pageRef = useRef(0);
  const [displayPage, setDisplayPage] = useState(0);

  const totalPages = pages.length;
  const lastPage = Math.max(0, totalPages - 1);

  const goNext = () => {
    const pf = bookRef.current?.pageFlip();
    if (!pf) return;
    const next = pageRef.current + 1;
    if (next > lastPage) return;
    pageRef.current = next;
    setDisplayPage(next);
    pf.flipNext();
  };

  const goPrev = () => {
    const pf = bookRef.current?.pageFlip();
    if (!pf) return;
    const prev = pageRef.current - 1;
    if (prev < 0) return;
    pageRef.current = prev;
    setDisplayPage(prev);
    pf.flipPrev();
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
          disabled={displayPage <= 0}
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
          <FlipBookInner pages={pages} bookRef={bookRef} width={bookWidth} height={bookHeight} />
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={displayPage >= pages.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-(--arvesta-bg-card) text-(--arvesta-gold) transition-all hover:bg-(--arvesta-gold)/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("next")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <p className="text-sm text-(--arvesta-text-muted)">
        {t("pageOf", { n: displayPage + 1, total: pages.length })}
      </p>
    </div>
  );
}
