"use client";

import { useEffect, useState } from "react";
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
  const router = useRouter();
  const [productId, setProductId] = useState<string>("");
  const [isNew, setIsNew] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

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
    params.then(({ id }) => {
      if (id !== "new") {
        setProductId(id);
        setIsNew(false);
        fetch(`/api/products`)
          .then((r) => r.json())
          .then((all: ProductResponse[]) => {
            const p = all.find((x) => x.id === id);
            if (p) {
              setSlug(p.slug);
              setCategoryId(p.categoryId);
              setFeatured(p.featured);
              setOrder(p.order);
              setImageUrl(p.images?.[0]?.url || "");
              const t: Record<string, { title: string; description: string }> =
                {};
              locales.forEach((l) => {
                const tr = p.translations.find((x) => x.locale === l);
                t[l] = {
                  title: tr?.title || "",
                  description: tr?.description || "",
                };
              });
              setTranslations(t);
            }
          });
      }
    });
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, [params]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.tempId && data.previewUrl) {
      setPendingTempId(data.tempId);
      setPendingPreviewUrl(data.previewUrl);
      setEditorOpen(true);
    }
    setUploading(false);
  }

  async function openEditorForExistingImage() {
    if (!imageUrl) return;

    setPreparing(true);
    try {
      const res = await fetch("/api/media/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: imageUrl }),
      });
      const data = await res.json();
      if (data?.tempId && data?.previewUrl) {
        setPendingTempId(data.tempId);
        setPendingPreviewUrl(data.previewUrl);
        setEditorOpen(true);
      }
    } finally {
      setPreparing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
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

    if (isNew) {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    router.push("/admin/products");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--arvesta-text-muted)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {isNew ? "Yeni Ürün" : "Ürün Düzenle"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white">
                Çoklu Dil İçerik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="fr">
                <TabsList className="bg-[var(--arvesta-bg-elevated)] border border-white/5 mb-4">
                  {locales.map((l) => (
                    <TabsTrigger
                      key={l}
                      value={l}
                      className="font-ui text-xs data-[state=active]:bg-[var(--arvesta-accent)] data-[state=active]:text-white"
                    >
                      {localeLabels[l]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {locales.map((l) => (
                  <TabsContent key={l} value={l} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[var(--arvesta-text-secondary)]">
                        Başlık ({l.toUpperCase()})
                      </Label>
                      <Input
                        value={translations[l]?.title || ""}
                        onChange={(e) =>
                          setTranslations({
                            ...translations,
                            [l]: { ...translations[l], title: e.target.value },
                          })
                        }
                        className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                        placeholder={`Ürün adı (${localeLabels[l]})`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[var(--arvesta-text-secondary)]">
                        Açıklama ({l.toUpperCase()})
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
                        className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white resize-none"
                        rows={3}
                        placeholder={`Ürün açıklaması (${localeLabels[l]})`}
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
          <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[var(--arvesta-accent)]" />{" "}
                Görsel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center mb-3">
                  <Upload className="w-8 h-8 text-[var(--arvesta-text-muted)]" />
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
                className="inline-flex w-full h-8 items-center justify-center rounded-lg border border-white/10 bg-[var(--arvesta-bg)] text-sm font-medium text-[var(--arvesta-text-secondary)] cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
              >
                {uploading ? "Yükleniyor..." : "Görsel Yükle"}
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!imageUrl || preparing}
                onClick={openEditorForExistingImage}
                className="mt-2 w-full border-white/10 text-[var(--arvesta-text-secondary)] font-ui"
              >
                {preparing ? "Hazırlanıyor..." : "Mevcut Görseli Düzenle"}
              </Button>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white">
                Detaylar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--arvesta-text-secondary)]">
                  Slug
                </Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                  placeholder="urun-adi"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--arvesta-text-secondary)]">
                  Kategori
                </Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--arvesta-bg-elevated)] border border-white/5 rounded-md text-white text-sm focus:border-[var(--arvesta-accent)] focus:outline-none"
                >
                  <option value="">Seçin...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.translations.find((t) => t.locale === "fr")?.name ||
                        c.slug}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--arvesta-text-secondary)]">
                  Sıra
                </Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="accent-[var(--arvesta-accent)]"
                />
                <Label
                  htmlFor="featured"
                  className="text-[var(--arvesta-text-secondary)] flex items-center gap-1"
                >
                  <Star className="w-3 h-3" /> Öne Çıkan
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui font-semibold h-11"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      <MediaEditorDialog
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
    </div>
  );
}
