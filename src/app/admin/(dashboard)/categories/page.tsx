"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Grid3X3, Save, Upload } from "lucide-react";
import Image from "next/image";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";

interface Cat {
  id: string;
  slug: string;
  order: number;
  image: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  _count: { products: number };
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function AdminCategories() {
  const t = useTranslations("adminCategories");
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
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

  const load = () =>
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  useEffect(() => {
    load();
  }, []);

  function openEdit(cat: Cat) {
    setEditing(cat);
    setIsNew(false);
    setSlug(cat.slug);
    setOrder(cat.order);
    setImage(cat.image || "");
    const tr2: Record<string, { name: string; description: string }> = {};
    locales.forEach((l) => {
      const tr = cat.translations.find((x) => x.locale === l);
      tr2[l] = { name: tr?.name || "", description: tr?.description || "" };
    });
    setTranslations(tr2);
  }

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setSlug("");
    setOrder(0);
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
      slug,
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
    setEditing(null);
    setIsNew(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
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
            {categories.length} {t("countLabel")}
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui"
        >
          <Plus className="w-4 h-4 mr-2" /> {t("newCategory")}
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
            : categories.map((cat) => (
                <Card
                  key={cat.id}
                  className="border-white/5 bg-(--arvesta-bg-card) hover:border-white/10 transition-all"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/5 relative shrink-0 flex items-center justify-center">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.slug}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <span className="text-[10px] text-(--arvesta-text-muted) font-ui">
                          {t("noImageLabel")}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-white block">
                        {cat.translations.find((tr) => tr.locale === "fr")
                          ?.name || cat.slug}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-white/10 text-(--arvesta-text-muted) text-xs font-ui mt-1"
                      >
                        {cat._count?.products || 0} {t("productCount")}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cat)}
                        className="text-(--arvesta-text-muted) hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cat.id)}
                        className="text-(--arvesta-text-muted) hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Edit Form */}
        {showForm && (
          <Card className="border-white/5 bg-(--arvesta-bg-card) h-fit">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-(--arvesta-accent)" />
                {isNew ? t("newCategory") : t("editCategory")}
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
                />
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
                  {t("categoryImage")}
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
                        alt="Kategori görseli"
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

              <Tabs defaultValue="fr">
                <TabsList className="bg-(--arvesta-bg-elevated) border border-white/5">
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
                  <TabsContent key={l} value={l} className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-(--arvesta-text-secondary) text-xs">
                        {t("name")} ({l.toUpperCase()})
                      </Label>
                      <Input
                        value={translations[l]?.name || ""}
                        onChange={(e) =>
                          setTranslations({
                            ...translations,
                            [l]: { ...translations[l], name: e.target.value },
                          })
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
