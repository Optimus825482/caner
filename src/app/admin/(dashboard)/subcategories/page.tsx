"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Layers, Save, Upload } from "lucide-react";
import Image from "next/image";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";

interface Cat {
  id: string;
  slug: string;
  translations: { locale: string; name: string }[];
}

interface SubCat {
  id: string;
  slug: string;
  order: number;
  image: string | null;
  categoryId: string;
  translations: { locale: string; name: string; description: string | null }[];
  category: Cat;
  _count: { products: number };
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function AdminSubCategories() {
  const t = useTranslations("adminSubCategories");
  const locale = useLocale();
  const [subCategories, setSubCategories] = useState<SubCat[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubCat | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [order, setOrder] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const [translations, setTranslations] = useState<
    Record<string, { name: string; description: string }>
  >(Object.fromEntries(locales.map((l) => [l, { name: "", description: "" }])));
  const [catLocale, setCatLocale] = useState("fr");
  const [autoTranslating, setAutoTranslating] = useState(false);
  const lastTranslatedRef = useRef<Record<string, string>>({});

  const autoTranslateFromTr = useCallback(
    async (field: "name" | "description") => {
      const text = translations.tr?.[field]?.trim();
      if (!text) return;
      const cacheKey = `${field}:${text}`;
      if (lastTranslatedRef.current[cacheKey]) return;
      setAutoTranslating(true);
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
          if (!res.ok) continue;
          const data = await res.json();
          if (data.translated) {
            setTranslations((prev) => ({
              ...prev,
              [targetLocale]: {
                ...prev[targetLocale],
                [field]: data.translated,
              },
            }));
          }
        }
        lastTranslatedRef.current[cacheKey] = text;
      } catch {
        // silent fail
      } finally {
        setAutoTranslating(false);
      }
    },
    [translations.tr],
  );

  const load = async () => {
    const [subRes, catRes] = await Promise.all([
      fetch("/api/subcategories"),
      fetch("/api/categories"),
    ]);
    const subData = await subRes.json();
    const catData = await catRes.json();
    setSubCategories(subData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  function openEdit(sub: SubCat) {
    setEditing(sub);
    setIsNew(false);
    setOrder(sub.order);
    setCategoryId(sub.categoryId);
    setImage(sub.image || "");
    const tr2: Record<string, { name: string; description: string }> = {};
    locales.forEach((l) => {
      const tr = sub.translations.find((x) => x.locale === l);
      tr2[l] = { name: tr?.name || "", description: tr?.description || "" };
    });
    setTranslations(tr2);
  }

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setOrder(0);
    setCategoryId(categories[0]?.id || "");
    setImage("");
    setTranslations(
      Object.fromEntries(
        locales.map((l) => [l, { name: "", description: "" }]),
      ),
    );
  }

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
    if (!image) return;
    setPreparing(true);
    try {
      const res = await fetch("/api/media/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: image }),
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
    const body = {
      categoryId,
      order,
      image: image.trim() ? image : undefined,
      translations: locales.map((l) => ({ locale: l, ...translations[l] })),
    };
    if (isNew) {
      await fetch("/api/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else if (editing) {
      await fetch(`/api/subcategories/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setEditing(null);
    setIsNew(false);
    load();
  }

  async function handleDelete(id: string) {
    const sub = subCategories.find((s) => s.id === id);
    const name =
      sub?.translations.find((tr) => tr.locale === locale)?.name ||
      sub?.translations.find((tr) => tr.locale === "fr")?.name ||
      sub?.slug ||
      "";
    if (!window.confirm(t("confirmDelete", { name }))) return;
    try {
      const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || t("deleteError"));
        return;
      }
    } catch {
      alert(t("deleteError"));
      return;
    }
    load();
  }

  const showForm = isNew || editing;

  const getCatName = (cat: Cat) =>
    cat.translations.find((tr) => tr.locale === locale)?.name ||
    cat.translations.find((tr) => tr.locale === "fr")?.name ||
    cat.slug;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {t("title")}
          </h1>
          <p className="text-(--arvesta-text-muted) font-ui text-sm">
            {subCategories.length} {t("countLabel")}
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui"
        >
          <Plus className="w-4 h-4 mr-2" /> {t("newSubCategory")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {loading
            ? [...Array(3)].map((_, i) => (
                <Card key={i} className="border-white/5 bg-(--arvesta-bg-card)">
                  <CardContent className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-16 h-12 rounded-lg bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-white/5" />
                      <div className="h-3 w-1/5 rounded bg-white/5" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : subCategories.map((sub) => {
                const name =
                  sub.translations.find((tr) => tr.locale === locale)?.name ||
                  sub.translations.find((tr) => tr.locale === "fr")?.name ||
                  sub.slug;
                return (
                  <Card
                    key={sub.id}
                    className="border-white/5 bg-(--arvesta-bg-card) hover:border-white/10 transition-all"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/5 relative shrink-0 flex items-center justify-center">
                        {sub.image ? (
                          <Image
                            src={sub.image}
                            alt={sub.slug}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <Layers className="w-5 h-5 text-(--arvesta-text-muted)" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-white block">
                          {name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="border-white/10 text-(--arvesta-accent) text-xs font-ui"
                          >
                            {getCatName(sub.category)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-white/10 text-(--arvesta-text-muted) text-xs font-ui"
                          >
                            {sub._count?.products || 0} {t("productCount")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(sub)}
                          className="text-(--arvesta-text-muted) hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sub.id)}
                          className="text-(--arvesta-text-muted) hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Edit Form */}
        {showForm && (
          <Card className="border-white/5 bg-(--arvesta-bg-card) h-fit">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-(--arvesta-accent)" />
                {isNew ? t("newSubCategory") : t("editSubCategory")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-(--arvesta-text-secondary)">
                  {t("parentCategory")}
                </Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 bg-(--arvesta-bg-elevated) border border-white/5 rounded-md text-white text-sm focus:border-(--arvesta-accent) focus:outline-none"
                  aria-label={t("parentCategory")}
                >
                  <option value="">{t("selectCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCatName(c)}
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

              <div className="space-y-2">
                <Label className="text-(--arvesta-text-secondary)">
                  {t("subCategoryImage")}
                </Label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUpload}
                      className="hidden"
                    />
                    <span className="inline-flex h-10 px-3 items-center rounded-md border border-white/10 bg-(--arvesta-bg-elevated) text-(--arvesta-text-secondary) text-sm cursor-pointer hover:text-white transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? t("uploading") : t("selectImage")}
                    </span>
                  </label>
                  {image ? (
                    <div className="relative w-16 h-12 rounded-md overflow-hidden border border-white/10 bg-black/20">
                      <Image
                        src={image}
                        alt="Alt kategori görseli"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-(--arvesta-text-muted)">
                      {t("noImage")}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!image || preparing}
                  onClick={openEditorForExistingImage}
                  className="w-full border-white/10 text-(--arvesta-text-secondary) font-ui"
                >
                  {preparing ? t("preparing") : t("editExisting")}
                </Button>
              </div>

              <Separator className="bg-white/5" />

              <div className="flex items-center gap-1 mb-3">
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setCatLocale(l)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${catLocale === l ? "bg-(--arvesta-accent) text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
                  >
                    {localeLabels[l]}
                  </button>
                ))}
              </div>

              <Tabs value={catLocale} onValueChange={setCatLocale}>
                <TabsList className="hidden">
                  {locales.map((l) => (
                    <TabsTrigger key={l} value={l}>
                      {localeLabels[l]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {locales.map((l) => (
                  <TabsContent key={l} value={l} className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-(--arvesta-text-secondary) text-xs">
                        {t("name")} ({l.toUpperCase()})
                        {l === "tr" && autoTranslating && (
                          <span className="ml-2 text-purple-400 text-[10px]">
                            çevriliyor...
                          </span>
                        )}
                      </Label>
                      <Input
                        value={translations[l]?.name || ""}
                        onChange={(e) =>
                          setTranslations({
                            ...translations,
                            [l]: { ...translations[l], name: e.target.value },
                          })
                        }
                        onBlur={
                          l === "tr"
                            ? () => autoTranslateFromTr("name")
                            : undefined
                        }
                        className="bg-(--arvesta-bg-elevated) border-white/5 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-(--arvesta-text-secondary) text-xs">
                        {t("description")} ({l.toUpperCase()})
                      </Label>
                      <Input
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
                        onBlur={
                          l === "tr"
                            ? () => autoTranslateFromTr("description")
                            : undefined
                        }
                        className="bg-(--arvesta-bg-elevated) border-white/5 text-white"
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui"
                >
                  <Save className="w-4 h-4 mr-2" /> {t("save")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setIsNew(false);
                  }}
                  className="text-(--arvesta-text-muted)"
                >
                  {t("cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MediaEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tempId={pendingTempId}
        previewUrl={pendingPreviewUrl}
        onPublished={(url) => {
          setImage(url);
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
