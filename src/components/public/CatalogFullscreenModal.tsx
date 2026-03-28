"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CatalogFlipbook } from "./CatalogFlipbook";
import { Button } from "@/components/ui/button";

interface Props {
  slug: string;
  locale: string;
  open: boolean;
  onClose: () => void;
}

export function CatalogFullscreenModal({
  slug,
  locale,
  open,
  onClose,
}: Props) {
  const [data, setData] = useState<{
    title: string;
    pages: { imageUrl: string }[];
  } | null>(null);

  useEffect(() => {
    if (!open || !slug) return;
    fetch(`/api/catalog?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.pages) {
          const tr = d.translations?.find((t: { locale: string }) => t.locale === locale) || d.translations?.[0];
          setData({
            title: tr?.title || d.slug,
            pages: d.pages,
          });
        }
      })
      .catch(() => setData(null));
  }, [open, slug, locale]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#050c19]">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-lg font-semibold text-white">
          {data?.title || "…"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/10"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {data && (
          <CatalogFlipbook pages={data.pages} title="" />
        )}
      </div>
    </div>
  );
}
