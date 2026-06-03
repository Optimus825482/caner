"use client";

import { memo, useRef, useState, useCallback } from "react";
import { MagazineBook, Page } from "react-magazine";
import type { PageFlipInstance } from "react-magazine";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

function normalizeImageUrl(url: string): string {
  if (!url?.trim()) return "";
  const s = url.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"))
    return s;
  return `/${s}`;
}

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

const PageContent = memo(function PageContent({
  imageUrl,
  number,
  t,
}: {
  imageUrl: string;
  number: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const src = normalizeImageUrl(imageUrl);
  return src ? (
    <img
      src={src}
      alt={t("pageAlt", { n: number })}
      className="absolute inset-0 w-full h-full object-contain"
      loading="eager"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-(--arvesta-text-muted) text-sm">
      {t("noImage")}
    </div>
  );
});

export function CatalogFlipbook({ pages, title }: Props) {
  const t = useTranslations("catalog");
  const bookRef = useRef<PageFlipInstance>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const onInit = useCallback((e: { data: number }) => {
    // react-magazine init event has wrong type — runtime data is {page, mode}
    const data = e.data as unknown as { page?: number };
    if (typeof data?.page === "number") {
      setCurrentPage(data.page);
    }
    const count = bookRef.current?.getPageCount() ?? 0;
    setPageCount(count);
  }, []);

  const handlePrev = useCallback(() => {
    bookRef.current?.flipPrev();
  }, []);

  const handleNext = useCallback(() => {
    bookRef.current?.flipNext();
  }, []);

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-(--arvesta-text-muted)">
        <p>{t("noPages")}</p>
      </div>
    );
  }

  const bookWidth = 400;
  const bookHeight = 550;
  const progress = pageCount > 1 ? currentPage + 1 : 0;
  const showPrev = currentPage > 0;
  const showNext = currentPage < pageCount - 1;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {title && (
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
      )}

      <div className="relative flex items-center gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!showPrev}
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
          <MagazineBook
            ref={bookRef}
            width={bookWidth}
            height={bookHeight}
            showCover={true}
            usePortrait={true}
            flippingTime={600}
            onFlip={onFlip}
            onInit={onInit}
          >
            {pages.map((p, i) => (
              <Page key={p.id ?? `${p.imageUrl}-${i}`} number={i + 1}>
                <PageContent imageUrl={p.imageUrl} number={i + 1} t={t} />
              </Page>
            ))}
          </MagazineBook>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!showNext}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-(--arvesta-bg-card) text-(--arvesta-gold) transition-all hover:bg-(--arvesta-gold)/10 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("next")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {progress > 0 && (
        <p className="text-sm text-(--arvesta-text-muted)">
          {t("pageOf", { n: progress, total: pageCount })}
        </p>
      )}
    </div>
  );
}
