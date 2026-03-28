"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogFlipbook } from "@/components/public/CatalogFlipbook";

export default function CatalogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [data, setData] = useState<{
    title: string;
    pages: { imageUrl: string }[];
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/catalog/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        const tr = d.translations?.[0];
        setData({
          title: tr?.title || d.slug,
          pages: d.pages || [],
        });
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050c19] text-white">
        <p className="text-(--arvesta-text-muted)">Katalog yüklenemedi.</p>
        <Link href="/admin/catalog">
          <Button variant="outline">Geri</Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050c19]">
        <p className="text-(--arvesta-text-muted)">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050c19] pb-24 pt-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/catalog">
            <Button variant="ghost" size="sm" className="text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
          </Link>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
            Önizleme
          </span>
        </div>
        <CatalogFlipbook pages={data.pages} title={data.title} />
      </div>
    </div>
  );
}
