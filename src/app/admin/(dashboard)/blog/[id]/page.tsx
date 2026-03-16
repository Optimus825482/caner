"use client";

import React, { useEffect, useState } from "react";
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
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  Languages,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";

interface BlogPostResponse {
  id: string;
  slug: string;
  image: string | null;
  published: boolean;
  order: number;
  translations: {
    locale: string;
    title?: string;
    excerpt?: string;
    content?: string;
  }[];
}

const locales = ["fr", "en", "tr"];
const localeLabels: Record<string, string> = {
  fr: "Français",
  en: "English",
  tr: "Türkçe",
};

export default function BlogFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = React.use(params);
  const t = useTranslations("adminBlogForm");
  const currentLocale = useLocale();
  const isNew = postId === "new";
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

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
      const fields = ["title", "excerpt", "content"] as const;
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

  async function handleAiGenerate(
    type: "blog_content" | "blog_excerpt",
    locale: string,
  ) {
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
        body: JSON.stringify({ type, prompt: title, locale }),
      });
      if (!res.ok) {
        alert(t("aiError"));
        return;
      }
      const data = await res.json();
      if (data.generated) {
        const field = type === "blog_content" ? "content" : "excerpt";
        setTranslations((prev) => ({
          ...prev,
          [locale]: { ...prev[locale], [field]: data.generated },
        }));
      }
    } catch {
      alert(t("aiError"));
    } finally {
      setAiGenerating(false);
    }
  }

  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [order, setOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [translations, setTranslations] = useState<
    Record<string, { title: string; excerpt: string; content: string }>
  >(
    Object.fromEntries(
      locales.map((l) => [l, { title: "", excerpt: "", content: "" }]),
    ),
  );

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/blog/${postId}`)
        .then((r) => r.json())
        .then((data: BlogPostResponse) => {
          setSlug(data.slug);
          setPublished(data.published);
          setOrder(data.order);
          setImageUrl(data.image || "");
          const tMap: typeof translations = {};
          for (const l of locales) {
            const tr = data.translations.find((t) => t.locale === l);
            tMap[l] = {
              title: tr?.title || "",
              excerpt: tr?.excerpt || "",
              content: tr?.content || "",
            };
          }
          setTranslations(tMap);
        });
    }
  }, [isNew, postId]);

  function updateTranslation(
    locale: string,
    field: "title" | "excerpt" | "content",
    value: string,
  ) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMessage("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Upload failed");
        return;
      }
      if (data.requiresPreprocess && data.tempId) {
        setPendingTempId(data.tempId);
        setPendingPreviewUrl(data.previewUrl);
        setEditorOpen(true);
      } else {
        setImageUrl(data.url);
      }
    } catch {
      setErrorMessage("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleEditorPublish(finalUrl: string) {
    setImageUrl(finalUrl);
    setEditorOpen(false);
    setPendingTempId(null);
    setPendingPreviewUrl(null);
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");
    const translationsArr = locales
      .filter((l) => translations[l].title.trim())
      .map((l) => ({
        locale: l,
        title: translations[l].title,
        excerpt: translations[l].excerpt || undefined,
        content: translations[l].content,
      }));

    const payload = {
      slug,
      image: imageUrl || null,
      published,
      order,
      translations: translationsArr,
    };

    try {
      const url = isNew ? "/api/blog" : `/api/blog/${postId}`;
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
      router.push("/admin/blog");
    } catch {
      setErrorMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {isNew ? t("newPost") : t("editPost")}
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">
              {t("multiLangContent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={currentLocale}>
              <TabsList className="mb-4">
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
                      onClick={() => handleAiGenerate("blog_excerpt", l)}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiGenerating
                        ? t("aiGenerating")
                        : t("aiGenerateExcerpt")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={aiGenerating}
                      onClick={() => handleAiGenerate("blog_content", l)}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiGenerating
                        ? t("aiGenerating")
                        : t("aiGenerateContent")}
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
                    <Label>{t("excerpt")}</Label>
                    <Textarea
                      value={translations[l]?.excerpt || ""}
                      onChange={(e) =>
                        updateTranslation(l, "excerpt", e.target.value)
                      }
                      placeholder={t("excerptPlaceholder")}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>{t("content")}</Label>
                    <Textarea
                      value={translations[l]?.content || ""}
                      onChange={(e) =>
                        updateTranslation(l, "content", e.target.value)
                      }
                      placeholder={t("contentPlaceholder")}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">{t("image")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {imageUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border border-zinc-700">
                  <Image src={imageUrl} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/50">
                  <ImageIcon className="h-8 w-8 text-zinc-600" />
                </div>
              )}
              {imageUrl && !uploading && !preparing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setPreparing(true);
                    setPendingPreviewUrl(imageUrl);
                    setPendingTempId(null);
                    setEditorOpen(true);
                    setPreparing(false);
                  }}
                >
                  {preparing ? t("preparing") : t("editExisting")}
                </Button>
              )}
              <label className="block cursor-pointer">
                <div className="inline-flex h-9 w-full items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? t("uploading") : t("uploadImage")}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                {t("details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("slug")}</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={t("slugPlaceholder")}
                />
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

      {editorOpen && (pendingTempId || pendingPreviewUrl) && (
        <MediaEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          tempId={pendingTempId}
          previewUrl={pendingPreviewUrl}
          onPublished={handleEditorPublish}
        />
      )}
    </div>
  );
}
