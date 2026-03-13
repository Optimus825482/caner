"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Upload, Eye, EyeOff } from "lucide-react";
import { MediaEditorDialog } from "@/components/admin/MediaEditorDialog";

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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const t = useTranslations("adminHero");

  const [image, setImage] = useState("");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<
    Record<string, { badge: string; title: string; subtitle: string }>
  >(Object.fromEntries(locales.map((l) => [l, { badge: "", title: "", subtitle: "" }])));

  const load = () =>
    fetch("/api/hero")
      .then((r) => r.json())
      .then((data) => { setSlides(data); setLoading(false); });
  useEffect(() => { load(); }, []);

  function openEdit(s: Slide) {
    setEditing(s);
    setIsNew(false);
    setImage(s.image);
    setOrder(s.order);
    setActive(s.active);
    const trans: Record<string, { badge: string; title: string; subtitle: string }> = {};
    locales.forEach((l) => {
      const tr = s.translations.find((x) => x.locale === l);
      trans[l] = { badge: tr?.badge || "", title: tr?.title || "", subtitle: tr?.subtitle || "" };
    });
    setTranslations(trans);
  }

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setImage("");
    setOrder(slides.length + 1);
    setActive(true);
    setTranslations(Object.fromEntries(locales.map((l) => [l, { badge: "", title: "", subtitle: "" }])));
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
    } finally { setPreparing(false); }
  }