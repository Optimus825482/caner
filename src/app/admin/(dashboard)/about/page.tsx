"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Save,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Languages,
} from "lucide-react";
import { AdminAboutContentEditor } from "@/components/admin/AdminAboutContentEditor";

const LOCALES = ["fr", "en", "tr"] as const;
const LOCALE_LABELS: Record<string, string> = {
  fr: "🇫🇷 FR",
  en: "🇬🇧 EN",
  tr: "🇹🇷 TR",
};

interface TeamMember {
  id: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  order: number;
  role: string;
  published: boolean;
  translations: { locale: string; fullName: string; title: string }[];
  createdAt: string;
}

export default function AdminAbout() {
  const t = useTranslations("adminAbout");
  const tTeam = useTranslations("adminTeam");
  const locale = useLocale();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [aiTranslating, setAiTranslating] = useState<string | null>(null);
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState({
    done: 0,
    total: 0,
  });
  const [activeLocale, setActiveLocale] = useState<"fr" | "en" | "tr">("tr");

  async function translateSingleField(
    _baseKey: string,
    trVal: string,
    targetLocale: string,
  ): Promise<string | null> {
    const res = await fetch("/api/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trVal,
        fromLocale: "tr",
        toLocale: targetLocale,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.translated || null;
    }
    return null;
  }

  async function autoTranslateField(baseKey: string) {
    const trVal = values[`${baseKey}_tr`]?.trim();
    if (!trVal) return;
    setAiTranslating(baseKey);
    try {
      for (const targetLocale of ["fr", "en"]) {
        const translated = await translateSingleField(
          baseKey,
          trVal,
          targetLocale,
        );
        if (translated) {
          setValues((prev) => ({
            ...prev,
            [`${baseKey}_${targetLocale}`]: translated,
          }));
        }
      }
    } finally {
      setAiTranslating(null);
    }
  }

  async function autoTranslateAllFields(): Promise<Record<string, string>> {
    const aboutTrKeys = Object.keys(values).filter(
      (k) => k.startsWith("about_") && k.endsWith("_tr") && values[k]?.trim(),
    );
    if (aboutTrKeys.length === 0) return {};

    const totalOps = aboutTrKeys.length * 2; // fr + en
    let done = 0;
    setTranslateProgress({ done: 0, total: totalOps });
    setBulkTranslating(true);

    const updates: Record<string, string> = {};

    for (const trKey of aboutTrKeys) {
      const baseKey = trKey.replace(/_tr$/, "");
      const trVal = values[trKey].trim();

      for (const targetLocale of ["fr", "en"]) {
        const targetKey = `${baseKey}_${targetLocale}`;
        // Sadece boş olan veya mevcut olmayan alanları çevir
        if (!values[targetKey]?.trim()) {
          const translated = await translateSingleField(
            baseKey.replace(/^about_/, ""),
            trVal,
            targetLocale,
          );
          if (translated) {
            updates[targetKey] = translated;
          }
        }
        done++;
        setTranslateProgress({ done, total: totalOps });
      }
    }

    setBulkTranslating(false);
    return updates;
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setValues);
  }, []);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setTeamMembers(Array.isArray(data) ? data : []);
        setTeamLoading(false);
      })
      .catch(() => setTeamLoading(false));
  }, []);

  async function handleSaveContent() {
    setSaving(true);

    // Türkçe alanlar doldurulmuş ama FR/EN boşsa otomatik çevir
    const translations = await autoTranslateAllFields();
    const merged = { ...values, ...translations };
    if (Object.keys(translations).length > 0) {
      setValues(merged);
    }

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function getName(item: TeamMember) {
    const tr =
      item.translations.find((x) => x.locale === locale) ||
      item.translations.find((x) => x.locale === "fr") ||
      item.translations[0];
    return tr?.fullName || tTeam("untitled");
  }

  function getTitle(item: TeamMember) {
    const tr =
      item.translations.find((x) => x.locale === locale) ||
      item.translations.find((x) => x.locale === "fr") ||
      item.translations[0];
    return tr?.title || "";
  }

  async function handleDeleteTeam() {
    if (!deleteId) return;
    await fetch(`/api/team/${deleteId}`, { method: "DELETE" });
    setTeamMembers((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  }

  async function togglePublished(item: TeamMember) {
    const res = await fetch(`/api/team/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: item.order,
        role: item.role || "member",
        published: !item.published,
      }),
    });
    if (res.ok) {
      setTeamMembers((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, published: !i.published } : i,
        ),
      );
    }
  }

  const deleteItem = teamMembers.find((i) => i.id === deleteId);

  return (
    <div>
      <Tabs defaultValue="content" className="space-y-6">
        {/* İçerik / Ekibimiz + Dil seçimi sayfanın en üstünde, scroll'da sabit */}
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex flex-col gap-3 bg-(--arvesta-bg)/95 px-4 py-4 backdrop-blur-sm sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="flex h-auto w-full gap-1 rounded-xl border border-(--arvesta-gold)/20 bg-[rgba(255,255,255,0.02)] p-1 sm:w-auto">
              <TabsTrigger
                value="content"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-(--arvesta-gold)/15 data-[state=active]:text-(--arvesta-gold)"
              >
                <Building2 className="h-4 w-4" />
                {t("contentTab")}
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-(--arvesta-gold)/15 data-[state=active]:text-(--arvesta-gold)"
              >
                <Users className="h-4 w-4" />
                {t("teamTab")} ({teamMembers.length})
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 rounded-xl border border-(--arvesta-gold)/20 bg-[rgba(255,255,255,0.02)] p-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setActiveLocale(loc)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                    activeLocale === loc
                      ? "bg-(--arvesta-gold)/15 text-(--arvesta-gold)"
                      : "text-(--arvesta-text-muted) hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <div className="mb-2">
              <h1 className="font-display text-2xl font-semibold text-white">
                {t("title")}
              </h1>
              <p className="font-ui text-sm text-(--arvesta-text-muted)">
                {t("subtitle")}
              </p>

              <TabsContent value="content" className="space-y-6">
                <Card className="border-(--arvesta-gold)/20 bg-[linear-gradient(170deg,rgba(8,16,30,0.96),rgba(6,12,24,0.96))]">
                  <CardHeader className="border-b border-(--arvesta-gold)/15">
                    <CardTitle className="font-ui text-base text-white">
                      {t("contentTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <AdminAboutContentEditor
                      values={values}
                      setValues={setValues}
                      activeLocale={activeLocale}
                      aiTranslating={aiTranslating}
                      autoTranslateField={autoTranslateField}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          const aboutTrKeys = Object.keys(values).filter(
                            (k) =>
                              k.startsWith("about_") &&
                              k.endsWith("_tr") &&
                              values[k]?.trim(),
                          );
                          if (aboutTrKeys.length === 0) return;
                          const totalOps = aboutTrKeys.length * 2;
                          let done = 0;
                          setTranslateProgress({ done: 0, total: totalOps });
                          setBulkTranslating(true);
                          const updates: Record<string, string> = {};
                          for (const trKey of aboutTrKeys) {
                            const baseKey = trKey
                              .replace(/_tr$/, "")
                              .replace(/^about_/, "");
                            const trVal = values[trKey].trim();
                            for (const targetLocale of ["fr", "en"]) {
                              const translated = await translateSingleField(
                                baseKey,
                                trVal,
                                targetLocale,
                              );
                              if (translated) {
                                updates[`about_${baseKey}_${targetLocale}`] =
                                  translated;
                              }
                              done++;
                              setTranslateProgress({ done, total: totalOps });
                            }
                          }
                          setValues((prev) => ({ ...prev, ...updates }));
                          setBulkTranslating(false);
                        }}
                        disabled={bulkTranslating || saving}
                        variant="outline"
                        className="flex-1 border-(--arvesta-gold)/30 font-ui font-semibold text-(--arvesta-gold) hover:bg-(--arvesta-gold)/10"
                      >
                        <Languages className="mr-2 h-4 w-4" />
                        {bulkTranslating
                          ? `${t("translating")} (${translateProgress.done}/${translateProgress.total})`
                          : t("translateAll")}
                      </Button>
                      <Button
                        onClick={handleSaveContent}
                        disabled={saving || bulkTranslating}
                        className={`flex-1 font-ui font-semibold ${saved ? "bg-green-600 hover:bg-green-600" : "bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover)"}`}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saved
                          ? t("saved")
                          : saving
                            ? t("saving")
                            : t("saveContent")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                <Card className="border-(--arvesta-gold)/20 bg-[linear-gradient(170deg,rgba(8,16,30,0.96),rgba(6,12,24,0.96))]">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-(--arvesta-gold)/15">
                    <CardTitle className="font-ui text-base text-white">
                      {t("teamTitle")}
                    </CardTitle>
                    <Link href="/admin/team/new">
                      <Button
                        size="sm"
                        className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover)"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {tTeam("newItem")}
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {teamLoading ? (
                      <div className="py-12 text-center text-(--arvesta-text-muted)">
                        {tTeam("loading")}
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="py-12 text-center text-(--arvesta-text-muted)">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p className="mb-4">{tTeam("noItems")}</p>
                        <Link href="/admin/team/new">
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            {tTeam("newItem")}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {teamMembers.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10"
                          >
                            {item.photo ? (
                              <Image
                                src={item.photo}
                                alt={getName(item)}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--arvesta-gold)/20 text-(--arvesta-gold) font-bold">
                                {getName(item).charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-white">
                                  {getName(item)}
                                </p>
                                {item.role === "lead" && (
                                  <span className="shrink-0 rounded bg-(--arvesta-gold)/20 px-1.5 py-0.5 text-[10px] font-medium text-(--arvesta-gold)">
                                    {t("leadBadge")}
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-(--arvesta-text-muted)">
                                {getTitle(item)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => togglePublished(item)}
                                className={`rounded p-1.5 transition-colors ${
                                  item.published
                                    ? "text-emerald-400 hover:bg-emerald-500/10"
                                    : "text-(--arvesta-text-muted) hover:bg-white/3"
                                }`}
                                title={
                                  item.published
                                    ? tTeam("published")
                                    : tTeam("draft")
                                }
                              >
                                {item.published ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                              <Link href={`/admin/team/${item.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-(--arvesta-text-muted) hover:text-white"
                                  aria-label={tTeam("editAriaLabel")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-(--arvesta-text-muted) hover:text-red-400"
                                aria-label={tTeam("deleteAriaLabel")}
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-(--arvesta-bg-card) border-white/5">
          <DialogHeader>
            <DialogTitle className="text-white font-display">
              {tTeam("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-(--arvesta-text-muted)">
              {tTeam("deleteDialog.descriptionPrefix")}{" "}
              <strong>
                &quot;{deleteItem ? getName(deleteItem) : ""}&quot;
              </strong>
              .{tTeam("deleteDialog.descriptionSuffix")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button
                variant="ghost"
                className="text-(--arvesta-text-secondary)"
              >
                {tTeam("deleteDialog.cancel")}
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              {tTeam("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
