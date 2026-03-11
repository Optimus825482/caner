"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Grid3X3, Save } from "lucide-react";
import Image from "next/image";

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
  const [categories, setCategories] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [translations, setTranslations] = useState<
    Record<string, { name: string; description: string }>
  >(Object.fromEntries(locales.map((l) => [l, { name: "", description: "" }])));

  const load = () =>
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  useEffect(() => {
    load();
  }, []);

  function openEdit(cat: Cat) {
    setEditing(cat);
    setIsNew(false);
    setSlug(cat.slug);
    setOrder(cat.order);
    const t: Record<string, { name: string; description: string }> = {};
    locales.forEach((l) => {
      const tr = cat.translations.find((x) => x.locale === l);
      t[l] = { name: tr?.name || "", description: tr?.description || "" };
    });
    setTranslations(t);
  }

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setSlug("");
    setOrder(0);
    setTranslations(
      Object.fromEntries(
        locales.map((l) => [l, { name: "", description: "" }]),
      ),
    );
  }

  async function handleSave() {
    const body = {
      slug,
      order,
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
            Kategoriler
          </h1>
          <p className="text-[var(--arvesta-text-muted)] font-ui text-sm">
            {categories.length} kategori
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Kategori
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="border-white/5 bg-[var(--arvesta-bg-card)] hover:border-white/10 transition-all"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/5 relative shrink-0">
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.slug}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white block">
                    {cat.translations.find((t) => t.locale === "fr")?.name ||
                      cat.slug}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-white/10 text-[var(--arvesta-text-muted)] text-xs font-ui mt-1"
                  >
                    {cat._count?.products || 0} ürün
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(cat)}
                    className="text-[var(--arvesta-text-muted)] hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cat.id)}
                    className="text-[var(--arvesta-text-muted)] hover:text-red-400"
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
          <Card className="border-white/5 bg-[var(--arvesta-bg-card)] h-fit">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-[var(--arvesta-accent)]" />
                {isNew ? "Yeni Kategori" : "Kategori Düzenle"}
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
                />
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

              <Separator className="bg-white/5" />

              <Tabs defaultValue="fr">
                <TabsList className="bg-[var(--arvesta-bg-elevated)] border border-white/5">
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
                  <TabsContent key={l} value={l} className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-[var(--arvesta-text-secondary)] text-xs">
                        Ad ({l.toUpperCase()})
                      </Label>
                      <Input
                        value={translations[l]?.name || ""}
                        onChange={(e) =>
                          setTranslations({
                            ...translations,
                            [l]: { ...translations[l], name: e.target.value },
                          })
                        }
                        className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[var(--arvesta-text-secondary)] text-xs">
                        Açıklama ({l.toUpperCase()})
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
                        className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui"
                >
                  <Save className="w-4 h-4 mr-2" /> Kaydet
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setIsNew(false);
                  }}
                  className="text-[var(--arvesta-text-muted)]"
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
