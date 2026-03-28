"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, ArrowLeft, Upload, Languages } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function TeamMemberFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: itemId } = React.use(params);
  const t = useTranslations("adminTeamForm");
  const currentLocale = useLocale();
  const isNew = itemId === "new";
  const router = useRouter();

  const [activeLocale, setActiveLocale] = useState(currentLocale);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [published, setPublished] = useState(true);
  const [order, setOrder] = useState(0);
  const [role, setRole] = useState<"lead" | "member">("member");
  const [photo, setPhoto] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aiTranslating, setAiTranslating] = useState(false);
  const lastTranslatedRef = useRef<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [translations, setTranslations] = useState<
    Record<string, { fullName: string; title: string }>
  >(Object.fromEntries(locales.map((l) => [l, { fullName: "", title: "" }])));

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/team/${itemId}`)
        .then((r) => r.json())
        .then((data) => {
          setPublished(data.published);
          setOrder(data.order);
          setRole(data.role === "lead" ? "lead" : "member");
          setPhoto(data.photo || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          const tMap: typeof translations = {};
          for (const l of locales) {
            const tr = data.translations.find(
              (t: { locale: string }) => t.locale === l,
            );
            tMap[l] = { fullName: tr?.fullName || "", title: tr?.title || "" };
          }
          setTranslations(tMap);
        });
    }
  }, [isNew, itemId]);

  function updateTranslation(
    locale: string,
    field: "fullName" | "title",
    value: string,
  ) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          setErrorMessage("Upload failed");
          return;
        }
        const uploadData = await uploadRes.json();

        const publishRes = await fetch("/api/media/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempId: uploadData.tempId, recipe: {} }),
        });
        if (!publishRes.ok) {
          setErrorMessage("Publish failed");
          return;
        }
        const publishData = await publishRes.json();
        setPhoto(publishData.url);
      } catch {
        setErrorMessage("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  async function autoTranslateFromTr(field: "fullName" | "title") {
    const text = translations.tr?.[field]?.trim();
    if (!text) return;
    const cacheKey = `${field}:${text}`;
    if (lastTranslatedRef.current[cacheKey]) return;
    // fullName is a proper name — don't translate it
    if (field === "fullName") return;
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
        if (!res.ok) continue;
        const data = await res.json();
        if (data.translated) {
          setTranslations((prev) => ({
            ...prev,
            [targetLocale]: { ...prev[targetLocale], [field]: data.translated },
          }));
        }
      }
      lastTranslatedRef.current[cacheKey] = text;
    } catch {
      // silent fail
    } finally {
      setAiTranslating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");
    const translationsArr = locales
      .filter((l) => translations[l].fullName.trim())
      .map((l) => ({
        locale: l,
        fullName: translations[l].fullName,
        title: translations[l].title,
      }));

    const payload = {
      photo: photo || null,
      email: email || null,
      phone: phone || null,
      published,
      order,
      role,
      translations: translationsArr,
    };

    try {
      const url = isNew ? "/api/team" : `/api/team/${itemId}`;
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
      router.push("/admin/about");
    } catch {
      setErrorMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/about">
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
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeLocale === l ? "bg-(--arvesta-accent) text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
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
                  <div>
                    <Label>
                      {t("fullName")}
                      {l === "tr" && aiTranslating && (
                        <span className="ml-2 text-purple-400 text-[10px]">
                          çevriliyor...
                        </span>
                      )}
                    </Label>
                    <Input
                      value={translations[l]?.fullName || ""}
                      onChange={(e) =>
                        updateTranslation(l, "fullName", e.target.value)
                      }
                      onBlur={
                        l === "tr"
                          ? () => {
                              const name = translations.tr?.fullName?.trim();
                              if (name) {
                                setTranslations((prev) => ({
                                  ...prev,
                                  fr: {
                                    ...prev.fr,
                                    fullName: prev.fr.fullName || name,
                                  },
                                  en: {
                                    ...prev.en,
                                    fullName: prev.en.fullName || name,
                                  },
                                }));
                              }
                            }
                          : undefined
                      }
                      placeholder={t("fullNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label>{t("role")}</Label>
                    <Input
                      value={translations[l]?.title || ""}
                      onChange={(e) =>
                        updateTranslation(l, "title", e.target.value)
                      }
                      onBlur={
                        l === "tr"
                          ? () => autoTranslateFromTr("title")
                          : undefined
                      }
                      placeholder={t("rolePlaceholder")}
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
              <CardTitle className="text-white text-sm">{t("photo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {photo ? (
                <div className="relative mx-auto w-32 h-32">
                  <Image
                    src={photo}
                    alt="Team member"
                    fill
                    className="rounded-full object-cover border-2 border-(--arvesta-gold)/30"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto("")}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-500"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-zinc-700 text-zinc-500">
                  <Upload className="h-8 w-8" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? t("uploading") : t("uploadPhoto")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                {t("contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("email")}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="[email]"
                />
              </div>
              <div>
                <Label>{t("phone")}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="[phone_number]"
                />
              </div>
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
                <Label>{t("position")}</Label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "lead" | "member")
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-(--arvesta-accent) focus:outline-none"
                >
                  <option value="member">{t("positionMember")}</option>
                  <option value="lead">{t("positionLead")}</option>
                </select>
              </div>
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
