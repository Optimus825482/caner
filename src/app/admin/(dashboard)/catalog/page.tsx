"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, ExternalLink } from "lucide-react";

function normalizeImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const s = url.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  return `/${s}`;
}

interface Catalog {
  id: string;
  slug: string;
  published: boolean;
  order: number;
  coverImage: string | null;
  translations: { locale: string; title: string }[];
  pages: { imageUrl: string }[];
  createdAt: string;
}

export default function AdminCatalog() {
  const t = useTranslations("adminCatalog");
  const locale = useLocale();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        setCatalogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getTitle(c: Catalog) {
    const tr =
      c.translations.find((x) => x.locale === locale) ||
      c.translations.find((x) => x.locale === "fr") ||
      c.translations[0];
    return tr?.title || c.slug;
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/catalog/${deleteId}`, { method: "DELETE" });
    setCatalogs((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
  }

  const deleteCatalog = catalogs.find((c) => c.id === deleteId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {t("title")}
          </h1>
          <p className="text-(--arvesta-text-muted) font-ui text-sm">
            {catalogs.length} {t("countLabel")}
          </p>
        </div>
        <Link href="/admin/catalog/new">
          <Button className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui">
            <Plus className="mr-2 h-4 w-4" />
            {t("newCatalog")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) animate-pulse"
            >
              <div className="aspect-[4/3] bg-white/5 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-white/5" />
                <div className="h-3 w-1/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : catalogs.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-(--arvesta-text-muted) mb-4" />
          <p className="text-(--arvesta-text-muted) font-ui">
            {t("noCatalogs")}
          </p>
          <Link href="/admin/catalog/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("newCatalog")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {catalogs.map((catalog) => {
            const coverUrl = normalizeImageUrl(catalog.coverImage || catalog.pages[0]?.imageUrl);
            return (
            <div
              key={catalog.id}
              className="group relative rounded-xl border border-white/5 bg-(--arvesta-bg-card) overflow-hidden transition-all hover:border-white/15"
            >
              <Link href={`/admin/catalog/${catalog.id}`} className="block">
                <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={getTitle(catalog)}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-(--arvesta-text-muted) text-xs">
                      <BookOpen className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  {catalog.published && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 font-ui text-[10px] backdrop-blur-sm">
                        <Eye className="w-3 h-3 mr-0.5" /> {t("published")}
                      </Badge>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <Link href={`/admin/catalog/${catalog.id}`}>
                  <h3 className="text-sm font-medium text-white truncate hover:text-(--arvesta-gold) transition-colors">
                    {getTitle(catalog)}
                  </h3>
                </Link>
                <p className="text-xs text-(--arvesta-text-muted) mt-0.5">
                  {catalog.pages.length} {t("pagesCount")}
                </p>

                <div className="mt-2 flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/catalog/preview/${catalog.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-(--arvesta-text-muted) hover:text-(--arvesta-gold)"
                      aria-label={t("previewAriaLabel")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/admin/catalog/${catalog.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-(--arvesta-text-muted) hover:text-white"
                      aria-label={t("editAriaLabel")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-(--arvesta-text-muted) hover:text-red-400"
                    aria-label={t("deleteAriaLabel")}
                    onClick={() => setDeleteId(catalog.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Dialog
                    open={deleteId === catalog.id}
                    onOpenChange={(o) => !o && setDeleteId(null)}
                  >
                    <DialogContent className="bg-(--arvesta-bg-card) border-white/5">
                      <DialogHeader>
                        <DialogTitle className="text-white font-display">
                          {t("deleteDialog.title")}
                        </DialogTitle>
                        <DialogDescription className="text-(--arvesta-text-muted)">
                          {t("deleteDialog.descriptionPrefix")} &quot;
                          {getTitle(catalog)}&quot;.&nbsp;
                          {t("deleteDialog.descriptionSuffix")}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button
                              variant="ghost"
                              className="text-(--arvesta-text-secondary)"
                            />
                          }
                        >
                          {t("deleteDialog.cancel")}
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete()}
                        >
                          {t("deleteDialog.confirm")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
