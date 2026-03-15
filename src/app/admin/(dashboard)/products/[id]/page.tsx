"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Save,
  Upload,
  Image as ImageIcon,
  Star,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";

interface Category {
  id: string;
  slug: string;
  translations: { locale: string; name: string }[];
}

interface ProductResponse {
  id: string;
  slug: string;
  categoryId: string;
  featured: boolean;
  order: number;
  images?: { url: string }[];
  translations: { locale: string; title?: string; description?: string }[];
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function ProductFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: productId } = React.use(params);
  const t = useTranslations("adminProductForm");
  const currentLocale = useLocale();
  const isNew = productId === "new";
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [order, setOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [translations, setTranslations] = useState<
    Record<string, { title: string; description: string }>
  >(
    Object.fromEntries(locales.map((l) => [l, { title: "", description: "" }])),
  );

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setErrorMessage("");

      try {
        const categoriesRes = await fetch("/api/categories");
        if (!categoriesRes.ok) {
          throw new Error("Kategoriler yüklenemedi.");
        }
        const categoriesData = (await categoriesRes.json()) as Category[];
        if (active) setCategories(categoriesData);

        if (!isNew) {
          const productRes = await fetch(`/api/products/${productId}`);
          if (!productRes.ok) {
            throw new Error("Ürün bilgisi yüklenemedi.");
          }

          const p = (await productRes.json()) as ProductResponse;
          if (!active) return;

          setSlug(p.slug);
          setCategoryId(p.categoryId);
          setFeatured(p.featured);
          setOrder(p.order);
          setImageUrl(p.images?.[0]?.url || "");

          const nextTranslations: Record<
            string,
            { title: string; description: string }
          > = {};

          locales.forEach((l) => {
            const tr = p.translations.find((x) => x.locale === l);
            nextTranslations[l] = {
              title: tr?.title || "",
              description: tr?.description || "",
            };
          });

          setTranslations(nextTranslations);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Veriler yüklenirken bir hata oluştu.";
        if (active) {
          setErrorMessage(message);
          alert(message);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [isNew, productId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

      if (!res.ok) {
        throw new Error(data.error || "Görsel yüklenemedi.");
      }

      if (data.tempId && data.previewUrl) {
        setPendingTempId(data.tempId);
        setPendingPreviewUrl(data.previewUrl);
        setEditorOpen(true);
      } else {
        throw new Error("Yükleme tamamlandı ancak önizleme oluşturulamadı.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Görsel yüklenemedi.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setUploading(false);
    }
  }

  async function openEditorForExistingImage() {
    if (!imageUrl) return;

    setPreparing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/media/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: imageUrl }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        tempId?: string;
        previewUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Görsel düzenleme için hazırlanamadı.");
      }

      if (data?.tempId && data?.previewUrl) {
        setPendingTempId(data.tempId);
        setPendingPreviewUrl(data.previewUrl);
        setEditorOpen(true);
      } else {
        throw new Error("Düzenleyici verisi alınamadı.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Görsel düzenleme hazırlanırken hata oluştu.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setPreparing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");

    const body = {
      slug,
      categoryId,
      featured,
      order,
      translations: locales.map((l) => ({ locale: l, ...translations[l] })),
      images: imageUrl
        ? [{ url: imageUrl, alt: translations.fr.title, order: 0 }]
        : [],
    };

    try {
      const res = await fetch(
        isNew ? "/api/products" : `/api/products/${productId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(payload.error || "Ürün kaydedilemedi.");
      }

      router.push("/admin/products");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ürün kaydedilemedi.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products">
          <Button
            variant="ghost"
            size="sm"
            className="text-(--arvesta-text-muted)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {isNew ? t("newProduct") : t("editProduct")}
          </h1>
        </div>
      </div>

      {editorOpen ? (
        <MediaEditorDialog
          mode="inline"
          open={editorOpen}
          onOpenChange={setEditorOpen}
          tempId={pendingTempId}
          previewUrl={pendingPreviewUrl}
          onPublished={(url) => {
            setImageUrl(url);
            setPendingTempId(null);
            setPendingPreviewUrl(null);
          }}
          onClose={() => {
            setPendingTempId(null);
            setPendingPreviewUrl(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {errorMessage && (
            <div className="lg:col-span-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/5 bg-(--arvesta-bg-card)">
              <CardHeader>
                <CardTitle className="font-ui text-base text-white">
                  {t("multiLangContent")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fr">
                  <TabsList className="bg-(--arvesta-bg-elevated) border border-white/5 mb-4">
                    {locales.map((l) => (
                      <TabsTrigger
                        key={l}
                        value={l}
                        className="font-ui text-xs data-[state=active]:bg-(--arvesta-accent) data-[state=active]:text-white"
                      >
                        {localeLabels[l]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {locales.map((l) => (
                    <TabsContent key={l} value={l} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-(--arvesta-text-secondary)">
                          {t("title")} ({l.toUpperCase()})
                        </Label>
                        <Input
                          value={translations[l]?.title || ""}
                          onChange={(e) =>
                            setTranslations({
                              ...translations,
                              [l]: {
                                ...translations[l],
                                title: e.target.value,
                              },
                            })
                          }
                          className="bg-(--arvesta-bg-elevated) border-white/5 text-white"
                          placeholder={`${t("titlePlaceholder")} (${localeLabels[l]})`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-(--arvesta-text-secondary)">
                          {t("description")} ({l.toUpperCase()})
                        </Label>
                        <Textarea
                          value={translations[l]?.description || ""}
                          onChange={(e) =>
                            setTranslations({
                              ...translations,
                              [l]: {
                                ...translations[l],
                                description: e.target.value,
                              },
                            })
                          }
                          className="bg-(--arvesta-bg-elevated) border-white/5 text-white resize-none"
                          rows={3}
                          placeholder={`${t("descriptionPlaceholder")} (${localeLabels[l]})`}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card className="border-white/5 bg-(--arvesta-bg-card)">
              <CardHeader>
                <CardTitle className="font-ui text-base text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-(--arvesta-accent)" />{" "}
                  {t("image")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imageUrl ? (
                  <div className="relative aspect-4/3 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                ) : (
                  <div className="aspect-4/3 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center mb-3">
                    <Upload className="w-8 h-8 text-(--arvesta-text-muted)" />
                  </div>
                )}
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <label
                  htmlFor="product-image-upload"
                  className="inline-flex w-full h-8 items-center justify-center rounded-lg border border-white/10 bg-(--arvesta-bg) text-sm font-medium text-(--arvesta-text-secondary) cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
                >
                  {uploading ? t("uploading") : t("uploadImage")}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!imageUrl || preparing}
                  onClick={openEditorForExistingImage}
                  className="mt-2 w-full border-white/10 text-(--arvesta-text-secondary) font-ui"
                >
                  {preparing ? t("preparing") : t("editExisting")}
                </Button>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="border-white/5 bg-(--arvesta-bg-card)">
              <CardHeader>
                <CardTitle className="font-ui text-base text-white">
                  {t("details")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-(--arvesta-text-secondary)">
                    {t("slug")}
                  </Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-(--arvesta-bg-elevated) border-white/5 text-white"
                    placeholder={t("slugPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="product-category"
                    className="text-(--arvesta-text-secondary)"
                  >
                    {t("category")}
                  </Label>
                  <select
                    id="product-category"
                    aria-label={t("category")}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-(--arvesta-bg-elevated) border border-white/5 rounded-md text-white text-sm focus:border-(--arvesta-accent) focus:outline-none"
                  >
                    <option value="">{t("selectCategory")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.translations.find((t) => t.locale === currentLocale)
                          ?.name ||
                          c.translations.find((t) => t.locale === "fr")?.name ||
                          c.slug}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-(--arvesta-text-secondary)">
                    {t("order")}
                  </Label>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="bg-(--arvesta-bg-elevated) border-white/5 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    aria-label={t("featured")}
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="accent-(--arvesta-accent)"
                  />
                  <Label
                    htmlFor="featured"
                    className="text-(--arvesta-text-secondary) flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" /> {t("featured")}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui font-semibold h-11"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
