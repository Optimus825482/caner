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
import {
  Plus,
  Pencil,
  Trash2,
  Grid3X3,
  Save,
  Upload,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";

interface SubCat {
  id: string;
  slug: string;
  order: number;
  image: string | null;
  categoryId: string;
  translations: { locale: string; name: string; description: string | null }[];
  _count: { products: number };
}

interface Cat {
  id: string;
  slug: string;
  order: number;
  image: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  _count: { subCategories: number };
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

type EditMode = "category" | "subcategory";

export default function AdminCategories() {
  const t = useTranslations("adminCategories");
  const tSub = useTranslations("adminSubCategories");
  const locale = useLocale();

  // Categories state
  const [categories, setCategories] = useState<Cat[]>([]);
  const [subCategories, setSubCategories] = useState<SubCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  // Form state
  const [editMode, setEditMode] = useState<EditMode>("category");
  const [editing, setEditing] = useState<Cat | SubCat | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [order, setOrder] = useState(0);
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
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
        // silent
      } finally {
        setAutoTranslating(false);
      }
    },
    [translations.tr],
  );

  const load = async () => {
    const [catRes, subRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/subcategories"),
    ]);
    const catData = await catRes.json();
    const subData = await subRes.json();
    setCategories(catData);
    setSubCategories(subData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const getName = (item: Cat | SubCat) =>
    item.translations.find((tr) => tr.locale === locale)?.name ||
    item.translations.find((tr) => tr.locale === "fr")?.name ||
    item.slug;

  const subsForCat = (catId: string) =>
    subCategories.filter((s) => s.categoryId === catId);

  function resetForm() {
    setEditing(null);
    setIsNew(false);
    setOrder(0);
    setImage("");
    setCategoryId("");
    setTranslations(
      Object.fromEntries(
        locales.map((l) => [l, { name: "", description: "" }]),
      ),
    );
  }

  function openEditCategory(cat: Cat) {
    setEditMode("category");
    setEditing(cat);
    setIsNew(false);
    setOrder(cat.order);
    setImage(cat.image || "");
    const tr2: Record<string, { name: string; description: string }> = {};
    locales.forEach((l) => {
      const tr = cat.translations.find((x) => x.locale === l);
      tr2[l] = { name: tr?.name || "", description: tr?.description || "" };
    });
    setTranslations(tr2);
  }

  function openNewCategory() {
    resetForm();
    setEditMode("category");
    setIsNew(true);
  }

  function openEditSubCategory(sub: SubCat) {
    setEditMode("subcategory");
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

  function openNewSubCategory(parentCatId: string) {
    resetForm();
    setEditMode("subcategory");
    setIsNew(true);
    setCategoryId(parentCatId);
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
    if (editMode === "category") {
      const body = {
        order,
        image: image.trim() ? image : undefined,
        translations: locales.map((l) => ({ locale: l, ...translations[l] })),
      };
      if (isNew) {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (editing) {
        await fetch(`/api/categories/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    } else {
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
    }
    resetForm();
    load();
  }

  async function handleDeleteCategory(id: string) {
    const name = getName(categories.find((c) => c.id === id) as Cat);
    if (!window.confirm(t("confirmDeleteCategory", { name }))) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
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

  async function handleDeleteSubCategory(id: string) {
    const sub = subCategories.find((s) => s.id === id);
    const name = sub ? getName(sub) : "";
    if (!window.confirm(tSub("confirmDelete", { name }))) return;
    try {
      const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || tSub("deleteError"));
        return;
      }
    } catch {
      alert(tSub("deleteError"));
      return;
    }
    load();
  }

  const showForm = isNew || editing;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {t("title")}
          </h1>
          <p className="text-(--arvesta-text-muted) font-ui text-sm">
            {categories.length} {t("countLabel")} · {subCategories.length}{" "}
            {tSub("countLabel")}
          </p>
        </div>
        <Button
          onClick={openNewCategory}
          className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui"
        >
          <Plus className="w-4 h-4 mr-2" /> {t("newCategory")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category + SubCategory List */}
        <div className="space-y-2">
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
            : categories.map((cat) => {
                const subs = subsForCat(cat.id);
                const isExpanded = expandedCatId === cat.id;
                return (
                  <div key={cat.id}>
                    <Card className="border-white/5 bg-(--arvesta-bg-card) hover:border-white/10 transition-all">
                      <CardContent className="p-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCatId(isExpanded ? null : cat.id)
                          }
                          className="text-(--arvesta-text-muted) hover:text-white transition-colors"
                          aria-label="Toggle subcategories"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5 relative shrink-0 flex items-center justify-center">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={cat.slug}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <Grid3X3 className="w-4 h-4 text-(--arvesta-text-muted)" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white block truncate">
                            {getName(cat)}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-white/10 text-(--arvesta-text-muted) text-xs font-ui mt-0.5"
                          >
                            {subs.length} {tSub("countLabel")}
                          </Badge>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openNewSubCategory(cat.id)}
                            className="text-(--arvesta-text-muted) hover:text-(--arvesta-accent)"
                            title={tSub("newSubCategory")}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCategory(cat)}
                            className="text-(--arvesta-text-muted) hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-(--arvesta-text-muted) hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subcategories nested */}
                    {isExpanded && subs.length > 0 && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-white/5 pl-3">
                        {subs.map((sub) => (
                          <Card
                            key={sub.id}
                            className="border-white/5 bg-(--arvesta-bg-elevated) hover:border-white/10 transition-all"
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="w-10 h-8 rounded overflow-hidden bg-white/5 relative shrink-0 flex items-center justify-center">
                                {sub.image ? (
                                  <Image
                                    src={sub.image}
                                    alt={sub.slug}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <Layers className="w-3.5 h-3.5 text-(--arvesta-text-muted)" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-white block truncate">
                                  {getName(sub)}
                                </span>
                                <span className="text-[10px] text-(--arvesta-text-muted)">
                                  {sub._count?.products || 0}{" "}
                                  {t("productCount")}
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditSubCategory(sub)}
                                  className="text-(--arvesta-text-muted) hover:text-white h-7 w-7 p-0"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteSubCategory(sub.id)
                                  }
                                  className="text-(--arvesta-text-muted) hover:text-red-400 h-7 w-7 p-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    {isExpanded && subs.length === 0 && (
                      <div className="ml-8 mt-1 border-l border-white/5 pl-3 py-2">
                        <span className="text-xs text-(--arvesta-text-muted)">
                          {tSub("noItems")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Edit Form */}
        {showForm && (
          <Card className="border-white/5 bg-(--arvesta-bg-card) h-fit">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white flex items-center gap-2">
                {editMode === "category" ? (
                  <>
                    <Grid3X3 className="w-4 h-4 text-(--arvesta-accent)" />
                    {isNew ? t("newCategory") : t("editCategory")}
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-(--arvesta-accent)" />
                    {isNew ? tSub("newSubCategory") : tSub("editSubCategory")}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parent category selector (subcategory only) */}
              {editMode === "subcategory" && (
                <div className="space-y-2">
                  <Label className="text-(--arvesta-text-secondary)">
                    {tSub("parentCategory")}
                  </Label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-(--arvesta-bg-elevated) border border-white/5 rounded-md text-white text-sm focus:border-(--arvesta-accent) focus:outline-none"
                    aria-label={tSub("parentCategory")}
                  >
                    <option value="">{tSub("selectCategory")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getName(c)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {editMode === "category"
                    ? t("categoryImage")
                    : tSub("subCategoryImage")}
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
                        alt="Görsel"
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
                  onClick={resetForm}
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
