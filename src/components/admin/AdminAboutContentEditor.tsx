"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  TreePine,
  Ruler,
  Truck,
  Pencil as PencilIcon,
  Factory,
  Wrench,
  PackageCheck,
  Upload,
  ImageIcon,
} from "lucide-react";
import ImageShimmer from "@/components/public/ImageShimmer";

type Values = Record<string, string>;

interface Props {
  values: Values;
  setValues: React.Dispatch<React.SetStateAction<Values>>;
  activeLocale: string;
  aiTranslating: string | null;
  autoTranslateField: (baseKey: string) => void;
}

const LOCALES = ["tr", "fr", "en"] as const;

export function AdminAboutContentEditor({
  values,
  setValues,
  activeLocale,
  aiTranslating,
  autoTranslateField,
}: Props) {
  // --- helpers ---
  const v = (baseKey: string, loc?: string): string =>
    values[`about_${baseKey}_${loc || activeLocale}`] || "";

  const update = (baseKey: string, val: string, loc?: string) => {
    setValues((prev) => ({
      ...prev,
      [`about_${baseKey}_${loc || activeLocale}`]: val,
    }));
  };

  const globalVal = (key: string) => values[key] || "";
  const globalUpdate = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  // --- edit dialog state ---
  const [editOpen, setEditOpen] = useState(false);
  const [editFields, setEditFields] = useState<
    { baseKey: string; label: string; type: "text" | "textarea" }[]
  >([]);
  const [editTitle, setEditTitle] = useState("");
  const [translating, setTranslating] = useState(false);

  const openEdit = (
    title: string,
    fields: { baseKey: string; label: string; type?: "text" | "textarea" }[],
  ) => {
    setEditTitle(title);
    setEditFields(fields.map((f) => ({ ...f, type: f.type || "text" })));
    setEditOpen(true);
  };

  const handleTranslateAndClose = async () => {
    setTranslating(true);
    for (const field of editFields) {
      const trVal = v(field.baseKey, "tr");
      if (trVal) {
        await autoTranslateField(`about_${field.baseKey}`);
      }
    }
    setTranslating(false);
    setEditOpen(false);
  };

  // --- image upload ---
  const imgRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [imgTarget, setImgTarget] = useState("");

  const openImgDialog = (settingKey: string) => {
    setImgTarget(settingKey);
    setImgDialogOpen(true);
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-about", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        globalUpdate(imgTarget, data.url);
      }
    } finally {
      setUploading(false);
      setImgDialogOpen(false);
      if (imgRef.current) imgRef.current.value = "";
    }
  };

  // --- edit button component ---
  const EditBtn = ({
    onClick,
    className = "",
  }: {
    onClick: () => void;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-(--arvesta-gold)/10 text-(--arvesta-gold) opacity-0 transition-all group-hover:opacity-100 hover:bg-(--arvesta-gold)/20 ${className}`}
    >
      <PencilIcon className="h-3 w-3" />
    </button>
  );

  const storyImage =
    globalVal("about_storyImage") || "/uploads/products/wardrobe-1.jpg";

  const processSteps = [
    { icon: PencilIcon, n: 1 },
    { icon: Factory, n: 2 },
    { icon: Wrench, n: 3 },
    { icon: PackageCheck, n: 4 },
  ];

  const crafts = [
    { icon: TreePine, n: 1 },
    { icon: Ruler, n: 2 },
    { icon: Truck, n: 3 },
  ];

  return (
    <>
      <div className="rounded-xl border border-(--arvesta-gold)/20 bg-[#050c19]/95 overflow-hidden">
        {/* ═══ Hero ═══ */}
        <section className="relative flex min-h-[40vh] items-center justify-center overflow-hidden px-6 pt-16 pb-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(241,216,164,0.08),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(10,20,44,0.5),transparent_50%)]" />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <div className="group relative inline-block">
              <span className="mb-5 inline-block font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-(--arvesta-gold)/80">
                {v("heroTag") || "HİKAYEMİZ"}
              </span>
              <EditBtn
                onClick={() =>
                  openEdit("Hero", [
                    { baseKey: "heroTag", label: "Etiket" },
                    { baseKey: "heroTitle", label: "Başlık" },
                    {
                      baseKey: "heroDesc",
                      label: "Açıklama",
                      type: "textarea",
                    },
                  ])
                }
                className="absolute -right-9 top-0"
              />
            </div>
            <h1 className="mb-7 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl">
              {v("heroTitle") || "Ustalık mirası, modern zarafet."}
            </h1>
            <p className="mx-auto max-w-xl text-[0.9375rem] leading-[1.75] text-(--arvesta-text-secondary) md:text-base">
              {v("heroDesc") || ""}
            </p>
            <div className="mx-auto mt-10 h-px w-20 bg-linear-to-r from-transparent via-(--arvesta-gold)/50 to-transparent" />
          </div>
        </section>

        {/* ═══ Story ═══ */}
        <section className="relative px-6 py-16 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
              {/* Story Image */}
              <div className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.06] shadow-[0_32px_64px_rgba(0,0,0,0.35)]">
                <ImageShimmer
                  src={storyImage}
                  alt="Arvesta atölye"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#050c19]/70 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={() => openImgDialog("about_storyImage")}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-(--arvesta-gold)/30 bg-black/60 text-(--arvesta-gold) opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-(--arvesta-gold)/20"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Story Text */}
              <div>
                <div className="group relative">
                  <span className="mb-4 block font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-(--arvesta-gold)/80">
                    {v("storyTag") || "AKSARAY'DAN PARİS'E"}
                  </span>
                  <EditBtn
                    onClick={() =>
                      openEdit("Hikaye", [
                        { baseKey: "storyTag", label: "Etiket" },
                        { baseKey: "storyTitle", label: "Başlık" },
                        {
                          baseKey: "storyP1",
                          label: "Paragraf 1",
                          type: "textarea",
                        },
                        {
                          baseKey: "storyP2",
                          label: "Paragraf 2",
                          type: "textarea",
                        },
                      ])
                    }
                    className="absolute -right-9 top-0"
                  />
                </div>
                <h2 className="mb-7 font-display text-2xl font-semibold leading-tight text-white md:text-3xl lg:text-4xl">
                  {v("storyTitle") || "İki kültür, tek standart."}
                </h2>
                <p className="mb-6 text-[0.9375rem] leading-[1.8] text-(--arvesta-text-secondary)">
                  {v("storyP1") || ""}
                </p>
                <p className="text-[0.9375rem] leading-[1.8] text-(--arvesta-text-secondary)">
                  {v("storyP2") || ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Process Flow ═══ */}
        <section className="relative overflow-hidden border-y border-white/[0.04] px-6 py-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(241,216,164,0.04),transparent_65%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="group relative mb-4 text-center">
              <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-(--arvesta-gold)/80">
                {v("processTag") || "YOLCULUĞUMUZ"}
              </span>
              <EditBtn
                onClick={() =>
                  openEdit("Süreç Başlık", [
                    { baseKey: "processTag", label: "Etiket" },
                    { baseKey: "processTitle", label: "Başlık" },
                  ])
                }
                className="absolute -right-1 top-0"
              />
            </div>
            <h2 className="mb-14 text-center font-display text-2xl font-semibold text-white md:text-3xl lg:text-4xl">
              {v("processTitle") || "Tasarımdan Teslimat'a"}
            </h2>

            <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <div className="pointer-events-none absolute top-16 right-12 left-12 hidden h-px bg-gradient-to-r from-transparent via-(--arvesta-gold)/25 to-transparent lg:block" />
              {processSteps.map((step) => (
                <div
                  key={step.n}
                  className="group relative flex flex-col items-center text-center"
                >
                  <div className="relative mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-(--arvesta-gold)/20 bg-(--arvesta-gold)/5">
                      <step.icon className="h-6 w-6 text-(--arvesta-gold)/80" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-white">
                    {v(`step${step.n}Title`)}
                  </h3>
                  <p className="mb-3 text-[0.8125rem] leading-[1.7] text-(--arvesta-text-secondary)">
                    {v(`step${step.n}Desc`)}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 rounded-full border border-(--arvesta-gold)/10 bg-(--arvesta-gold)/5 px-3 py-1 font-ui text-[10px] font-medium uppercase tracking-[0.08em] text-(--arvesta-gold)/70">
                    {v(`step${step.n}Location`)}
                  </span>
                  <EditBtn
                    onClick={() =>
                      openEdit(`Adım ${step.n}`, [
                        { baseKey: `step${step.n}Title`, label: "Başlık" },
                        {
                          baseKey: `step${step.n}Desc`,
                          label: "Açıklama",
                          type: "textarea",
                        },
                        { baseKey: `step${step.n}Location`, label: "Konum" },
                      ])
                    }
                    className="absolute -right-1 top-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Craftsmanship ═══ */}
        <section className="relative px-6 py-16 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="group relative mb-4 text-center">
              <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-(--arvesta-gold)/80">
                {v("craftsTag") || "USTALIK"}
              </span>
              <EditBtn
                onClick={() =>
                  openEdit("Ustalık Başlık", [
                    { baseKey: "craftsTag", label: "Etiket" },
                    { baseKey: "craftsTitle", label: "Başlık" },
                  ])
                }
                className="absolute -right-1 top-0"
              />
            </div>
            <h2 className="mb-14 text-center font-display text-2xl font-semibold text-white md:text-3xl lg:text-4xl">
              {v("craftsTitle") || "Malzeme Seçiminden Montaja"}
            </h2>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-12">
              {crafts.map((craft) => (
                <div
                  key={craft.n}
                  className="group relative flex flex-col items-center text-center"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-(--arvesta-gold)/20 bg-(--arvesta-gold)/5">
                    <craft.icon className="h-6 w-6 text-(--arvesta-gold)/80" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-white">
                    {v(`craft${craft.n}Title`)}
                  </h3>
                  <p className="text-[0.8125rem] leading-[1.7] text-(--arvesta-text-secondary)">
                    {v(`craft${craft.n}Desc`)}
                  </p>
                  <EditBtn
                    onClick={() =>
                      openEdit(`Ustalık ${craft.n}`, [
                        { baseKey: `craft${craft.n}Title`, label: "Başlık" },
                        {
                          baseKey: `craft${craft.n}Desc`,
                          label: "Açıklama",
                          type: "textarea",
                        },
                      ])
                    }
                    className="absolute -right-1 top-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ═══ Edit Dialog ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-white/5 bg-(--arvesta-bg-card)">
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              {editTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editFields.map((field) => (
              <div key={field.baseKey}>
                <label className="mb-1 block text-xs font-medium text-(--arvesta-text-muted)">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={v(field.baseKey)}
                    onChange={(e) => update(field.baseKey, e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                    rows={3}
                  />
                ) : (
                  <Input
                    value={v(field.baseKey)}
                    onChange={(e) => update(field.baseKey, e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="text-(--arvesta-text-secondary)"
              >
                Kapat
              </Button>
            </DialogClose>
            <Button
              onClick={handleTranslateAndClose}
              disabled={translating}
              className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover)"
            >
              {translating ? "Çevriliyor..." : "Kaydet & Çevir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Image Upload Dialog ═══ */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className="border-white/5 bg-(--arvesta-bg-card)">
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              Görsel Yükle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={imgRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImgUpload}
              className="block w-full text-sm text-(--arvesta-text-secondary) file:mr-4 file:rounded-full file:border-0 file:bg-(--arvesta-gold)/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-(--arvesta-gold) hover:file:bg-(--arvesta-gold)/20"
            />
            {uploading && (
              <p className="text-sm text-(--arvesta-text-muted)">
                Yükleniyor...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
