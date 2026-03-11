"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Upload, Eye, EyeOff } from "lucide-react";

interface Slide {
  id: string;
  image: string;
  order: number;
  active: boolean;
  translations: {
    locale: string;
    badge: string | null;
    title: string;
    subtitle: string | null;
  }[];
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = { fr: "FR", en: "EN", tr: "TR" };

export default function AdminHero() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [image, setImage] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<
    Record<string, { badge: string; title: string; subtitle: string }>
  >(
    Object.fromEntries(
      locales.map((l) => [l, { badge: "", title: "", subtitle: "" }]),
    ),
  );

  const load = () =>
    fetch("/api/hero")
      .then((r) => r.json())
      .then(setSlides);
  useEffect(() => {
    load();
  }, []);

  function openEdit(s: Slide) {
    setEditing(s);
    setIsNew(false);
    setImage(s.image);
    setOrder(s.order);
    setActive(s.active);
    const t: Record<
      string,
      { badge: string; title: string; subtitle: string }
    > = {};
    locales.forEach((l) => {
      const tr = s.translations.find((x) => x.locale === l);
      t[l] = {
        badge: tr?.badge || "",
        title: tr?.title || "",
        subtitle: tr?.subtitle || "",
      };
    });
    setTranslations(t);
  }

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setImage("");
    setOrder(slides.length + 1);
    setActive(true);
    setTranslations(
      Object.fromEntries(
        locales.map((l) => [l, { badge: "", title: "", subtitle: "" }]),
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
    if (data.url) setImage(data.url);
    setUploading(false);
  }

  async function handleSave() {
    const body = {
      id: editing?.id,
      image,
      order,
      active,
      translations: locales.map((l) => ({ locale: l, ...translations[l] })),
    };
    if (isNew) {
      await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/hero", {
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
    await fetch(`/api/hero?id=${id}`, { method: "DELETE" });
    load();
  }

  const showForm = isNew || editing;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Hero Slider
          </h1>
          <p className="text-[var(--arvesta-text-muted)] font-ui text-sm">
            {slides.length} slide
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Slide
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slides List */}
        <div className="space-y-3">
          {slides.map((s) => (
            <Card
              key={s.id}
              className={`border-white/5 bg-[var(--arvesta-bg-card)] hover:border-white/10 transition-all cursor-pointer ${editing?.id === s.id ? "border-[var(--arvesta-accent)]/30" : ""}`}
              onClick={() => openEdit(s)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-white/5 relative shrink-0">
                  <Image
                    src={s.image}
                    alt="Slide"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white block truncate">
                    {s.translations.find((t) => t.locale === "fr")?.title ||
                      "Başlıksız"}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs font-ui ${s.active ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}
                    >
                      {s.active ? "Aktif" : "Pasif"}
                    </Badge>
                    <span className="text-xs text-[var(--arvesta-text-muted)]">
                      Sıra: {s.order}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.id);
                  }}
                  className="text-[var(--arvesta-text-muted)] hover:text-red-400 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Form */}
        {showForm && (
          <Card className="border-white/5 bg-[var(--arvesta-bg-card)] h-fit">
            <CardHeader>
              <CardTitle className="font-ui text-base text-white">
                {isNew ? "Yeni Slide" : "Slide Düzenle"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image */}
              {image ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[var(--arvesta-text-muted)]" />
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-[var(--arvesta-text-secondary)] font-ui"
                  type="button"
                >
                  {uploading ? "Yükleniyor..." : "Görsel Yükle"}
                </Button>
              </label>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[var(--arvesta-text-secondary)] text-xs">
                    Sıra
                  </Label>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant={active ? "default" : "outline"}
                    onClick={() => setActive(!active)}
                    className={
                      active
                        ? "bg-green-600 hover:bg-green-700"
                        : "border-white/10 text-[var(--arvesta-text-muted)]"
                    }
                  >
                    {active ? (
                      <Eye className="w-4 h-4 mr-1" />
                    ) : (
                      <EyeOff className="w-4 h-4 mr-1" />
                    )}
                    {active ? "Aktif" : "Pasif"}
                  </Button>
                </div>
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
                        Badge
                      </Label>
                      <Input
                        value={translations[l]?.badge || ""}
                        onChange={(e) =>
                          setTranslations({
                            ...translations,
                            [l]: { ...translations[l], badge: e.target.value },
                          })
                        }
                        className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white"
                        placeholder="PREMIUM DESIGN"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[var(--arvesta-text-secondary)] text-xs">
                        Başlık
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
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[var(--arvesta-text-secondary)] text-xs">
                        Alt Başlık
                      </Label>
                      <Textarea
                        value={translations[l]?.subtitle || ""}
                        onChange={(e) =>
                          setTranslations({
                            ...translations,
                            [l]: {
                              ...translations[l],
                              subtitle: e.target.value,
                            },
                          })
                        }
                        className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white resize-none"
                        rows={2}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <Button
                onClick={handleSave}
                className="w-full bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui font-semibold"
              >
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
