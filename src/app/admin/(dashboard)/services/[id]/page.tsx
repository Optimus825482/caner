"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, ArrowLeft, X, Search, Sparkles, Languages } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

const MATERIAL_ICONS = [
  "design_services",
  "architecture",
  "palette",
  "brush",
  "build",
  "construction",
  "handyman",
  "plumbing",
  "local_shipping",
  "inventory_2",
  "package_2",
  "deployed_code",
  "verified",
  "workspace_premium",
  "star",
  "diamond",
  "support_agent",
  "headset_mic",
  "contact_support",
  "help",
  "home",
  "kitchen",
  "bathroom",
  "living",
  "chair",
  "table_restaurant",
  "bed",
  "door_sliding",
  "carpenter",
  "hardware",
  "measuring_tape",
  "straighten",
  "format_paint",
  "imagesearch_roller",
  "wallpaper",
  "texture",
  "precision_manufacturing",
  "engineering",
  "settings",
  "tune",
  "shield",
  "security",
  "verified_user",
  "gpp_good",
  "eco",
  "forest",
  "nature",
  "park",
  "payments",
  "receipt_long",
  "request_quote",
  "calculate",
  "schedule",
  "timer",
  "event",
  "calendar_month",
  "photo_camera",
  "view_in_ar",
  "3d_rotation",
  "layers",
  "lightbulb",
  "tips_and_updates",
  "auto_awesome",
  "flare",
  "storefront",
  "store",
  "shopping_bag",
  "local_mall",
  "location_on",
  "map",
  "public",
  "language",
  "speed",
  "bolt",
  "rocket_launch",
  "trending_up",
];

export default function ServiceFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: itemId } = React.use(params);
  const t = useTranslations("adminServiceForm");
  const currentLocale = useLocale();
  const isNew = itemId === "new";
  const router = useRouter();

  const [activeLocale, setActiveLocale] = useState(currentLocale);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [published, setPublished] = useState(true);
  const [order, setOrder] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [translations, setTranslations] = useState<
    Record<string, { title: string; summary: string; detail: string }>
  >(
    Object.fromEntries(
      locales.map((l) => [l, { title: "", summary: "", detail: "" }]),
    ),
  );

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return MATERIAL_ICONS;
    const q = iconSearch.toLowerCase();
    return MATERIAL_ICONS.filter((icon) => icon.includes(q));
  }, [iconSearch]);

  async function handleAiTranslate(targetLocale: string) {
    const sourceLocale = locales.find(
      (l) => l !== targetLocale && translations[l]?.title?.trim(),
    );
    if (!sourceLocale) {
      alert(t("aiNoSource"));
      return;
    }
    setAiTranslating(true);
    try {
      const fields = ["title", "summary", "detail"] as const;
      for (const field of fields) {
        const text = translations[sourceLocale]?.[field]?.trim();
        if (!text) continue;
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            fromLocale: sourceLocale,
            toLocale: targetLocale,
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.translated) {
          setTranslations((prev) => ({
            ...prev,
            [targetLocale]: { ...prev[targetLocale], [field]: data.translated },
          }));
        }
      }
    } catch {
      alert(t("aiError"));
    } finally {
      setAiTranslating(false);
    }
  }

  async function handleAiGenerate(locale: string) {
    const title = translations[locale]?.title?.trim();
    if (!title) {
      alert(t("aiNoSource"));
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "service_detail", prompt: title, locale }),
      });
      if (!res.ok) {
        alert(t("aiError"));
        return;
      }
      const data = await res.json();
      if (data.generated) {
        setTranslations((prev) => ({
          ...prev,
          [locale]: { ...prev[locale], detail: data.generated },
        }));
      }
    } catch {
      alert(t("aiError"));
    } finally {
      setAiGenerating(false);
    }
  }

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/services/${itemId}`)
        .then((r) => r.json())
        .then((data) => {
          setPublished(data.published);
          setOrder(data.order);
          setSelectedIcon(data.icon || "");
          const tMap: typeof translations = {};
          for (const l of locales) {
            const tr = data.translations.find(
              (t: { locale: string }) => t.locale === l,
            );
            tMap[l] = {
              title: tr?.title || "",
              summary: tr?.summary || "",
              detail: tr?.detail || "",
            };
          }
          setTranslations(tMap);
        });
    }
  }, [isNew, itemId]);

  function updateTranslation(
    locale: string,
    field: "title" | "summary" | "detail",
    value: string,
  ) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");
    const translationsArr = locales
      .filter((l) => translations[l].title.trim())
      .map((l) => ({
        locale: l,
        title: translations[l].title,
        summary: translations[l].summary,
        detail: translations[l].detail,
      }));

    const payload = {
      icon: selectedIcon || null,
      published,
      order,
      translations: translationsArr,
    };

    try {
      const url = isNew ? "/api/services" : `/api/services/${itemId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Save failed");
        return;
      }
      router.push("/admin/services");
    } catch {
      setErrorMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {isNew ? t("newItem") : t("editItem")}
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-2">
        {t("multiLangContent")}
      </h2>
      <div className="mb-4 flex items-center gap-1">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setActiveLocale(l)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeLocale === l
                ? "bg-(--arvesta-accent) text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            {localeLabels[l]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <Tabs value={activeLocale} onValueChange={setActiveLocale}>
              <TabsList className="hidden">
                {locales.map((l) => (
                  <TabsTrigger key={l} value={l}>
                    {localeLabels[l]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {locales.map((l) => (
                <TabsContent key={l} value={l} className="space-y-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={aiTranslating || aiGenerating}
                      onClick={() => handleAiTranslate(l)}
                      className="text-zinc-400 hover:text-purple-300 text-xs gap-1.5"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      {aiTranslating ? t("aiTranslating") : t("aiTranslate")}
                    </Button>
                  </div>
                  <div>
                    <Label>{t("title")}</Label>
                    <Input
                      value={translations[l]?.title || ""}
                      onChange={(e) =>
                        updateTranslation(l, "title", e.target.value)
                      }
                      placeholder={t("titlePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label>{t("summary")}</Label>
                    <Textarea
                      value={translations[l]?.summary || ""}
                      onChange={(e) =>
                        updateTranslation(l, "summary", e.target.value)
                      }
                      placeholder={t("summaryPlaceholder")}
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>{t("detail")}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={aiGenerating || aiTranslating}
                        onClick={() => handleAiGenerate(l)}
                        className="text-zinc-400 hover:text-purple-300 text-xs gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {aiGenerating ? t("aiGenerating") : t("aiGenerate")}
                      </Button>
                    </div>
                    <Textarea
                      value={translations[l]?.detail || ""}
                      onChange={(e) =>
                        updateTranslation(l, "detail", e.target.value)
                      }
                      placeholder={t("detailPlaceholder")}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">{t("icon")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder={t("searchIcon")}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                {filteredIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() =>
                      setSelectedIcon(icon === selectedIcon ? "" : icon)
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                      selectedIcon === icon
                        ? "bg-(--arvesta-accent) text-white"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                    title={icon}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {icon}
                    </span>
                  </button>
                ))}
              </div>
              {selectedIcon && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="material-symbols-outlined text-base text-(--arvesta-gold)">
                    {selectedIcon}
                  </span>
                  <span>{selectedIcon}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIcon("")}
                    className="ml-auto"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                {t("details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("order")}</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published-toggle">{t("published")}</Label>
                <input
                  id="published-toggle"
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="accent-(--arvesta-accent) h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
