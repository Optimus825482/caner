"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, ArrowLeft, Sparkles, Languages } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface FaqItemResponse {
  id: string;
  order: number;
  published: boolean;
  translations: {
    locale: string;
    question?: string;
    answer?: string;
  }[];
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function FaqFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: itemId } = React.use(params);
  const t = useTranslations("adminFaqForm");
  const currentLocale = useLocale();
  const isNew = itemId === "new";
  const router = useRouter();

  const [activeLocale, setActiveLocale] = useState(currentLocale);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [published, setPublished] = useState(true);
  const [order, setOrder] = useState(0);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [translations, setTranslations] = useState<
    Record<string, { question: string; answer: string }>
  >(Object.fromEntries(locales.map((l) => [l, { question: "", answer: "" }])));

  async function handleAiTranslate(targetLocale: string) {
    const sourceLocale = locales.find(
      (l) => l !== targetLocale && translations[l]?.question?.trim(),
    );
    if (!sourceLocale) {
      alert(t("aiNoSource"));
      return;
    }
    setAiTranslating(true);
    try {
      const fields = ["question", "answer"] as const;
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
    const question = translations[locale]?.question?.trim();
    if (!question) {
      alert(t("aiNoSource"));
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "faq_answer", prompt: question, locale }),
      });
      if (!res.ok) {
        alert(t("aiError"));
        return;
      }
      const data = await res.json();
      if (data.generated) {
        setTranslations((prev) => ({
          ...prev,
          [locale]: { ...prev[locale], answer: data.generated },
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
      fetch(`/api/faq/${itemId}`)
        .then((r) => r.json())
        .then((data: FaqItemResponse) => {
          setPublished(data.published);
          setOrder(data.order);
          const tMap: typeof translations = {};
          for (const l of locales) {
            const tr = data.translations.find((t) => t.locale === l);
            tMap[l] = {
              question: tr?.question || "",
              answer: tr?.answer || "",
            };
          }
          setTranslations(tMap);
        });
    }
  }, [isNew, itemId]);

  function updateTranslation(
    locale: string,
    field: "question" | "answer",
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
      .filter((l) => translations[l].question.trim())
      .map((l) => ({
        locale: l,
        question: translations[l].question,
        answer: translations[l].answer,
      }));

    const payload = {
      order,
      published,
      translations: translationsArr,
    };

    try {
      const url = isNew ? "/api/faq" : `/api/faq/${itemId}`;
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
      router.push("/admin/faq");
    } catch {
      setErrorMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/faq">
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
        {/* Main content */}
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
                      variant="outline"
                      size="sm"
                      disabled={aiGenerating}
                      onClick={() => handleAiGenerate(l)}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiGenerating ? t("aiGenerating") : t("aiGenerate")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={aiTranslating}
                      onClick={() => handleAiTranslate(l)}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs gap-1.5"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      {aiTranslating ? t("aiTranslating") : t("aiTranslate")}
                    </Button>
                  </div>
                  <div>
                    <Label>{t("question")}</Label>
                    <Input
                      value={translations[l]?.question || ""}
                      onChange={(e) =>
                        updateTranslation(l, "question", e.target.value)
                      }
                      placeholder={t("questionPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label>{t("answer")}</Label>
                    <Textarea
                      value={translations[l]?.answer || ""}
                      onChange={(e) =>
                        updateTranslation(l, "answer", e.target.value)
                      }
                      placeholder={t("answerPlaceholder")}
                      rows={6}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
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
