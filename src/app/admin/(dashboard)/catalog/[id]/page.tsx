"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Upload, Trash2, Package, Languages, ExternalLink } from "lucide-react";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CatalogPage {
  id?: string;
  imageUrl: string;
  order: number;
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function CatalogFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: catalogId } = React.use(params);
  const t = useTranslations("adminCatalogForm");
  const locale = useLocale();
  const isNew = catalogId === "new";
  const router = useRouter();

  const [activeLocale, setActiveLocale] = useState(locale);
  const [translations, setTranslations] = useState<Record<string, { title: string }>>({
    fr: { title: "" },
    en: { title: "" },
    tr: { title: "" },
  });
  const [published, setPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<"cover" | "page">("page");
  const [errorMessage, setErrorMessage] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [aiTranslating, setAiTranslating] = useState(false);

  async function autoTranslateField() {
    const text = translations.tr?.title?.trim();
    if (!text) return;
    setAiTranslating(true);
    try {
      for (const targetLocale of ["fr", "en"]) {
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            fromLocale: "tr",
            toLocale: targetLocale,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translated) {
            setTranslations((prev) => ({
              ...prev,
              [targetLocale]: { ...prev[targetLocale], title: data.translated },
            }));
          }
        }
      }
    } finally {
      setAiTranslating(false);
    }
  }

  useEffect(() => {
    if (isNew) return;
    let active = true;

    async function load() {
      const res = await fetch(`/api/catalog/${catalogId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !active) return;

      const tr: Record<string, { title: string }> = {};
      for (const t of data.translations || []) {
        tr[t.locale] = { title: t.title || "" };
      }
      setTranslations({
        fr: tr.fr || { title: "" },
        en: tr.en || { title: "" },
        tr: tr.tr || { title: "" },
      });
      setPublished(data.published ?? false);
      setCoverImage(data.coverImage || null);
      setPages(
        (data.pages || []).map((p: { imageUrl: string; order: number }) => ({
          imageUrl: p.imageUrl,
          order: p.order,
        })),
      );
    }

    load();
    return () => {
      active = false;
    };
  }, [isNew, catalogId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: "cover" | "page") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMessage("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        tempId?: string;
        previewUrl?: string;
        error?: string;
      };

      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (data.tempId && data.previewUrl) {
        setPendingTempId(data.tempId);
        setPendingPreviewUrl(data.previewUrl);
        setPendingTarget(target);
        setEditorOpen(true);
      } else {
        throw new Error("Upload completed but preview unavailable");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handlePublished(url: string) {
    if (pendingTarget === "cover") {
      setCoverImage(url);
    } else {
      setPages((prev) => [
        ...prev,
        { imageUrl: url, order: prev.length },
      ]);
    }
    setPendingTempId(null);
    setPendingPreviewUrl(null);
  }

  function movePage(index: number, direction: "up" | "down") {
    const newPages = [...pages];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newPages.length) return;
    [newPages[index], newPages[swap]] = [newPages[swap], newPages[index]];
    setPages(newPages.map((p, i) => ({ ...p, order: i })));
  }

  function removePage(index: number) {
    setPages((prev) => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i })));
  }

  async function openProductPicker() {
    setProductPickerOpen(true);
    const res = await fetch("/api/products");
    const products = await res.json().catch(() => []);
    const urls: string[] = [];
    for (const p of products) {
      for (const img of p.images || []) {
        if (img?.url) urls.push(img.url);
      }
    }
    setProductImages(urls);
  }

  function addProductImage(url: string) {
    setPages((prev) => [...prev, { imageUrl: url, order: prev.length }]);
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");

    const body = {
      translations: locales.map((l) => ({
        locale: l,
        title: translations[l]?.title?.trim() || "",
      })),
      published,
      coverImage: coverImage || null,
      pages: pages.map((p, i) => ({ imageUrl: p.imageUrl, order: i })),
    };

    try {
      const res = await fetch(
        isNew ? "/api/catalog" : `/api/catalog/${catalogId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Save failed");

      router.push("/admin/catalog");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (editorOpen && pendingTempId && pendingPreviewUrl) {
    return (
      <MediaEditorDialog
        mode="inline"
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tempId={pendingTempId}
        previewUrl={pendingPreviewUrl}
        onPublished={handlePublished}
        onClose={() => {
          setPendingTempId(null);
          setPendingPreviewUrl(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/catalog">
            <Button variant="ghost" size="sm" className="text-(--arvesta-text-muted)">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-white">
            {isNew ? t("newCatalog") : t("editCatalog")}
          </h1>
        </div>
        {!isNew && (
          <Link href={`/admin/catalog/preview/${catalogId}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-(--arvesta-gold) border-(--arvesta-gold)/30 hover:bg-(--arvesta-gold)/10">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("preview")}
            </Button>
          </Link>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* Translations */}
        <div className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("multiLangContent")}
          </h2>
          <div className="flex gap-2 mb-4">
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLocale(l)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeLocale === l
                    ? "bg-(--arvesta-accent) text-white"
                    : "bg-white/5 text-(--arvesta-text-muted) hover:bg-white/10 hover:text-white"
                }`}
              >
                {localeLabels[l]}
              </button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-(--arvesta-text-secondary)">{t("title")}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px] text-(--arvesta-gold) hover:bg-(--arvesta-gold)/10"
                disabled={!translations.tr?.title?.trim() || aiTranslating}
                onClick={autoTranslateField}
              >
                <Languages className="h-3 w-3" />
                {aiTranslating ? "…" : "TR → FR, EN"}
              </Button>
            </div>
            <Input
              value={translations[activeLocale]?.title ?? ""}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [activeLocale]: { title: e.target.value },
                }))
              }
              placeholder={t("titlePlaceholder")}
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Published */}
        <div className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">{t("publish")}</h2>
              <p className="text-sm text-(--arvesta-text-muted) mt-1">
                {t("publishDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublished((p) => !p)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                published ? "bg-(--arvesta-accent)" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  published ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Cover image */}
        <div className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("coverImage")}
          </h2>
          <div className="flex gap-4 items-start">
            {coverImage ? (
              <div className="relative w-32 h-40 rounded-lg overflow-hidden border border-white/10">
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute top-1 right-1 rounded bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : null}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e, "cover")}
              />
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors">
                {uploading ? (
                  <span className="text-xs text-(--arvesta-text-muted)">
                    {t("uploading")}
                  </span>
                ) : (
                  <Upload className="w-6 h-6 text-(--arvesta-text-muted)" />
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Pages */}
        <div className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("pages")} ({pages.length})
          </h2>
          <p className="text-sm text-(--arvesta-text-muted) mb-4">
            {t("pagesDesc")}
          </p>

          <div className="space-y-3 mb-4">
            {pages.map((page, index) => (
              <div
                key={`${page.imageUrl}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => movePage(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-(--arvesta-text-muted) hover:text-white disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => movePage(index, "down")}
                    disabled={index === pages.length - 1}
                    className="p-1 text-(--arvesta-text-muted) hover:text-white disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <div className="relative w-16 h-20 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={page.imageUrl}
                    alt={`Page ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-sm text-(--arvesta-text-muted)">
                  {t("page")} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removePage(index)}
                  className="ml-auto p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e, "page")}
              />
              <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-white/5 px-6 py-4 hover:bg-white/10 transition-colors">
                {uploading ? (
                  <span className="text-sm text-(--arvesta-text-muted)">
                    {t("uploading")}
                  </span>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-(--arvesta-text-muted)" />
                    <span className="text-sm font-medium text-white">
                      {t("addPage")}
                    </span>
                  </>
                )}
              </div>
            </label>
            <Button
              type="button"
              variant="outline"
              className="border-white/20"
              onClick={openProductPicker}
            >
              <Package className="w-4 h-4 mr-2" />
              {t("pickFromProducts")}
            </Button>
          </div>

          <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
            <DialogContent className="bg-(--arvesta-bg-card) border-white/5 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {t("pickFromProducts")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
                {productImages.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      addProductImage(url);
                      setProductPickerOpen(false);
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-(--arvesta-accent) transition-colors"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                ))}
              </div>
              {productImages.length === 0 && (
                <p className="text-(--arvesta-text-muted) text-sm py-4">
                  {t("noProductImages")}
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !translations.fr?.title?.trim()}
            className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
