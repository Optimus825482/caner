"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaEditRecipe, MediaTextOverlay } from "@/types/media";
import ReactCrop, { type Crop } from "react-image-crop";
import Image from "next/image";
import "react-image-crop/dist/ReactCrop.css";
import { DepthParallaxViewer } from "@/components/admin/DepthParallaxViewer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tempId: string | null;
  previewUrl: string | null;
  onPublished: (url: string) => void;
  onClose?: () => void;
};

const defaultOverlay = (): MediaTextOverlay => ({
  text: "ARVESTA",
  x: 50,
  y: 50,
  size: 42,
  color: "#ffffff",
  opacity: 0.9,
  weight: 700,
});

const clampPercent = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseNumberOr = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function MediaEditorDialog({
  open,
  onOpenChange,
  tempId,
  previewUrl,
  onPublished,
  onClose,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flip, setFlip] = useState(false);
  const [flop, setFlop] = useState(false);
  const [quality, setQuality] = useState(85);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [blur, setBlur] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [gamma, setGamma] = useState(1.0);
  const [autoEnhance, setAutoEnhance] = useState(false);

  const [cropObj, setCropObj] = useState<Crop>();
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [appliedCrop, setAppliedCrop] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [cropApplied, setCropApplied] = useState(false);

  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkType, setWatermarkType] = useState<"text" | "logo">("text");
  const [watermarkText, setWatermarkText] = useState("ARVESTA");
  const [watermarkPosition, setWatermarkPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkScale, setWatermarkScale] = useState(0.4);

  const [textOverlays, setTextOverlays] = useState<MediaTextOverlay[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const [depthMapTempId, setDepthMapTempId] = useState<string | null>(null);
  const [depthIntensity, setDepthIntensity] = useState(50);
  const [depthLoading, setDepthLoading] = useState(false);
  const [depthError, setDepthError] = useState<string | null>(null);

  const previewFilter = useMemo(() => {
    const b = 100 + brightness;
    const c = 100 + contrast;
    const s = 100 + saturation;
    const blurPx = blur > 0 ? `blur(${blur}px)` : "";
    return `brightness(${b}%) contrast(${c}%) saturate(${s}%) ${blurPx}`.trim();
  }, [brightness, contrast, saturation, blur]);

  function resetState() {
    setActiveTab("basic");
    setRotate(0);
    setFlip(false);
    setFlop(false);
    setQuality(85);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpen(0);
    setBlur(0);
    setVignette(0);
    setTemperature(0);
    setGamma(1.0);
    setAutoEnhance(false);
    setCropObj(undefined);
    setCropX(0);
    setCropY(0);
    setCropW(100);
    setCropH(100);
    setAppliedCrop({ x: 0, y: 0, width: 100, height: 100 });
    setCropApplied(false);
    setWatermarkEnabled(false);
    setWatermarkType("text");
    setWatermarkText("ARVESTA");
    setWatermarkPosition("bottom-right");
    setWatermarkOpacity(0.7);
    setWatermarkScale(0.4);
    setTextOverlays([]);
    setDepthMapUrl(null);
    setDepthMapTempId(null);
    setDepthIntensity(50);
    setDepthLoading(false);
    setDepthError(null);
  }

  function resetStyleToDefaults() {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpen(0);
    setBlur(0);
    setVignette(0);
    setTemperature(0);
    setGamma(1.0);
  }

  async function handleGenerateDepthMap() {
    if (!tempId) return;
    setDepthLoading(true);
    setDepthError(null);
    try {
      const res = await fetch("/api/media/depth-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Depth map oluşturulamadı" }));
        throw new Error(data.error || "Depth map oluşturulamadı");
      }
      const data = await res.json();
      setDepthMapUrl(data.depthMapUrl);
      setDepthMapTempId(data.depthMapTempId);
    } catch (err) {
      setDepthError(
        err instanceof Error ? err.message : "Depth map oluşturulamadı",
      );
    } finally {
      setDepthLoading(false);
    }
  }

  async function handlePublish() {
    if (!tempId) return;
    setSaving(true);

    const recipe: MediaEditRecipe = {
      crop: {
        x: appliedCrop.x,
        y: appliedCrop.y,
        width: appliedCrop.width,
        height: appliedCrop.height,
      },
      rotate,
      flip: flip || undefined,
      flop: flop || undefined,
      quality,
      brightness,
      contrast,
      saturation,
      sharpen: sharpen || undefined,
      blur: blur || undefined,
      vignette: vignette || undefined,
      temperature: temperature || undefined,
      gamma: gamma !== 1.0 ? gamma : undefined,
      autoEnhance,
      watermark: {
        enabled: watermarkEnabled,
        type: watermarkType,
        text: watermarkText,
        position: watermarkPosition,
        opacity: watermarkOpacity,
        scale: watermarkScale,
      },
      textOverlays: textOverlays.filter((t) => t.text.trim().length > 0),
      depthParallax: depthMapUrl
        ? {
            enabled: true,
            depthMapTempId: depthMapTempId!,
            intensity: depthIntensity,
          }
        : undefined,
    };

    try {
      const res = await fetch("/api/media/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId, recipe }),
      });

      const data = await res.json();

      if (data?.url) {
        onPublished(data.url);
        onOpenChange(false);
        resetState();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] xl:max-w-[1400px] h-[90vh] bg-[var(--arvesta-bg-card)] border border-white/10 text-white p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-2 shrink-0">
          <DialogTitle className="font-ui">Görsel Ön İşleme</DialogTitle>
          <DialogDescription className="text-[var(--arvesta-text-muted)]">
            Düzenlemeleri uygula, ardından Kaydet ile anında yayınla.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 px-5 pb-5 flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 relative flex justify-center items-center overflow-hidden h-full">
            {previewUrl ? (
              <div className="relative max-h-full flex items-center justify-center overflow-hidden">
                {activeTab === "depth" && depthMapUrl ? (
                  <DepthParallaxViewer
                    imageUrl={previewUrl}
                    depthMapUrl={depthMapUrl}
                    intensity={depthIntensity}
                    className="max-w-full max-h-[calc(90vh-140px)] object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <>
                    <ReactCrop
                      crop={
                        cropObj ?? {
                          unit: "%",
                          x: cropX,
                          y: cropY,
                          width: cropW,
                          height: cropH,
                        }
                      }
                      onChange={(_pixelCrop, percentCrop) => {
                        const nextX = clampPercent(percentCrop.x ?? 0, 0, 100);
                        const nextY = clampPercent(percentCrop.y ?? 0, 0, 100);
                        const nextW = clampPercent(
                          percentCrop.width ?? 100,
                          1,
                          100,
                        );
                        const nextH = clampPercent(
                          percentCrop.height ?? 100,
                          1,
                          100,
                        );
                        setCropObj({
                          unit: "%",
                          x: nextX,
                          y: nextY,
                          width: nextW,
                          height: nextH,
                        });
                        setCropX(nextX);
                        setCropY(nextY);
                        setCropW(nextW);
                        setCropH(nextH);
                      }}
                      className="max-h-full flex justify-center overflow-hidden"
                    >
                      <img
                        src={previewUrl}
                        alt="Önizleme"
                        className="max-w-full max-h-[calc(90vh-140px)] object-contain rounded-lg shadow-2xl"
                        style={{
                          filter: previewFilter,
                          transform: `rotate(${rotate}deg)${flip ? " scaleY(-1)" : ""}${flop ? " scaleX(-1)" : ""}`,
                          transformOrigin: "center",
                        }}
                      />
                    </ReactCrop>

                    {/* Vignette preview */}
                    {vignette > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none rounded-lg"
                        style={{
                          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignette / 100}) 100%)`,
                        }}
                      />
                    )}

                    {/* Watermark Live Preview */}
                    {watermarkEnabled && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          inset: 0,
                          transform: `rotate(${rotate}deg)`,
                          display: "flex",
                          padding: "3%",
                          alignItems: watermarkPosition.includes("top")
                            ? "flex-start"
                            : watermarkPosition.includes("bottom")
                              ? "flex-end"
                              : "center",
                          justifyContent: watermarkPosition.includes("left")
                            ? "flex-start"
                            : watermarkPosition.includes("right")
                              ? "flex-end"
                              : "center",
                        }}
                      >
                        {watermarkType === "logo" ? (
                          <div
                            className="flex items-center justify-center rounded-full flex-col shadow-xl"
                            style={{
                              width: `${Math.max(10, watermarkScale * 28)}%`,
                              aspectRatio: "1/1",
                              backgroundColor: `rgba(0,0,0,${watermarkOpacity * 0.45})`,
                            }}
                          >
                            <Image
                              src="/logo.png"
                              alt="Arvesta logo filigran önizlemesi"
                              width={220}
                              height={220}
                              className="h-auto w-[70%] object-contain"
                              style={{ opacity: watermarkOpacity }}
                            />
                          </div>
                        ) : (
                          <div
                            className="text-white font-bold flex items-center justify-center rounded-xl p-2 md:p-4 shadow-xl text-center"
                            style={{
                              backgroundColor: `rgba(0,0,0,${watermarkOpacity * 0.45})`,
                              opacity: watermarkOpacity,
                              fontSize: `${Math.max(12, watermarkScale * 42)}px`,
                              maxWidth: "85%",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              letterSpacing: "2px",
                            }}
                          >
                            {watermarkText || "ARVESTA"}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[var(--arvesta-text-muted)]">
                Önizleme bulunamadı
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="space-y-4 overflow-y-auto pr-2 pb-10">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col"
            >
              <TabsList className="bg-[var(--arvesta-bg-elevated)] border border-white/10 w-full grid grid-cols-2 sm:grid-cols-5 gap-1 h-auto p-1">
                <TabsTrigger
                  value="basic"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Temel
                </TabsTrigger>
                <TabsTrigger
                  value="crop"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Kes
                </TabsTrigger>
                <TabsTrigger
                  value="style"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Stil
                </TabsTrigger>
                <TabsTrigger
                  value="overlay"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Katman
                </TabsTrigger>
                <TabsTrigger
                  value="depth"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Derinlik
                </TabsTrigger>
              </TabsList>

              {/* === BASIC TAB === */}
              <TabsContent value="basic" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[var(--arvesta-text-secondary)]">
                    Döndür
                  </Label>
                  <div className="flex gap-2">
                    {([0, 90, 180, 270] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={rotate === value ? "default" : "outline"}
                        className={
                          rotate === value
                            ? "bg-[var(--arvesta-accent)]"
                            : "border-white/10 text-[var(--arvesta-text-secondary)]"
                        }
                        onClick={() => setRotate(value)}
                      >
                        {value}°
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={flip ? "default" : "outline"}
                    className={
                      flip
                        ? "bg-[var(--arvesta-accent)]"
                        : "border-white/10 text-[var(--arvesta-text-secondary)]"
                    }
                    onClick={() => setFlip(!flip)}
                  >
                    ↕ Dikey Ayna
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={flop ? "default" : "outline"}
                    className={
                      flop
                        ? "bg-[var(--arvesta-accent)]"
                        : "border-white/10 text-[var(--arvesta-text-secondary)]"
                    }
                    onClick={() => setFlop(!flop)}
                  >
                    ↔ Yatay Ayna
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="quality-range"
                    className="text-xs text-[var(--arvesta-text-secondary)]"
                  >
                    Kalite ({quality})
                  </Label>
                  <Input
                    id="quality-range"
                    type="range"
                    min={1}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="autoEnhance"
                    type="checkbox"
                    aria-label="Otomatik iyileştirmeyi etkinleştir"
                    title="Otomatik iyileştirmeyi etkinleştir"
                    checked={autoEnhance}
                    onChange={(e) => setAutoEnhance(e.target.checked)}
                    className="accent-[var(--arvesta-accent)]"
                  />
                  <Label
                    htmlFor="autoEnhance"
                    className="text-sm text-[var(--arvesta-text-secondary)]"
                  >
                    Otomatik İyileştirme
                  </Label>
                </div>
              </TabsContent>

              {/* === CROP TAB === */}
              <TabsContent value="crop" className="space-y-3 mt-3">
                <div className="text-xs text-[var(--arvesta-text-muted)] mb-2">
                  Görsel üzerindeki çerçeveyi sürükleyerek de kesme
                  yapabilirsiniz.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-x"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      X (%)
                    </Label>
                    <Input
                      id="crop-x"
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(cropX)}
                      onChange={(e) => {
                        const next = clampPercent(
                          parseNumberOr(e.target.value, cropX),
                          0,
                          100,
                        );
                        setCropX(next);
                        setCropObj(
                          (prev) =>
                            ({
                              ...(prev || ({ unit: "%" } as Crop)),
                              x: next,
                            }) as Crop,
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-y"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Y (%)
                    </Label>
                    <Input
                      id="crop-y"
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(cropY)}
                      onChange={(e) => {
                        const next = clampPercent(
                          parseNumberOr(e.target.value, cropY),
                          0,
                          100,
                        );
                        setCropY(next);
                        setCropObj(
                          (prev) =>
                            ({
                              ...(prev || ({ unit: "%" } as Crop)),
                              y: next,
                            }) as Crop,
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-width"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Genişlik (%)
                    </Label>
                    <Input
                      id="crop-width"
                      type="number"
                      min={1}
                      max={100}
                      value={Math.round(cropW)}
                      onChange={(e) => {
                        const next = clampPercent(
                          parseNumberOr(e.target.value, cropW),
                          1,
                          100,
                        );
                        setCropW(next);
                        setCropObj(
                          (prev) =>
                            ({
                              ...(prev || ({ unit: "%" } as Crop)),
                              width: next,
                            }) as Crop,
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-height"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Yükseklik (%)
                    </Label>
                    <Input
                      id="crop-height"
                      type="number"
                      min={1}
                      max={100}
                      value={Math.round(cropH)}
                      onChange={(e) => {
                        const next = clampPercent(
                          parseNumberOr(e.target.value, cropH),
                          1,
                          100,
                        );
                        setCropH(next);
                        setCropObj(
                          (prev) =>
                            ({
                              ...(prev || ({ unit: "%" } as Crop)),
                              height: next,
                            }) as Crop,
                        );
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-4 bg-[var(--arvesta-accent)] text-black hover:bg-opacity-90"
                  onClick={() => {
                    setAppliedCrop({
                      x: clampPercent(cropX, 0, 100),
                      y: clampPercent(cropY, 0, 100),
                      width: clampPercent(cropW, 1, 100),
                      height: clampPercent(cropH, 1, 100),
                    });
                    setCropApplied(true);
                    setActiveTab("style");
                  }}
                >
                  Kesim Alanını Onayla
                </Button>
                {cropApplied && (
                  <p className="text-xs text-emerald-300">
                    Kesim alanı uygulandı. Kaydet ve Yayınla ile çıktıya
                    işlenecek.
                  </p>
                )}
              </TabsContent>

              {/* === STYLE TAB === */}
              <TabsContent value="style" className="space-y-3 mt-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-xs text-[var(--arvesta-text-muted)] hover:text-white"
                    onClick={resetStyleToDefaults}
                  >
                    Sıfırla
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="brightness-range"
                    className="text-xs text-[var(--arvesta-text-secondary)]"
                  >
                    Parlaklık ({brightness})
                  </Label>
                  <Input
                    id="brightness-range"
                    type="range"
                    min={-100}
                    max={100}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="contrast-range"
                    className="text-xs text-[var(--arvesta-text-secondary)]"
                  >
                    Kontrast ({contrast})
                  </Label>
                  <Input
                    id="contrast-range"
                    type="range"
                    min={-100}
                    max={100}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="saturation-range"
                    className="text-xs text-[var(--arvesta-text-secondary)]"
                  >
                    Doygunluk ({saturation})
                  </Label>
                  <Input
                    id="saturation-range"
                    type="range"
                    min={-100}
                    max={100}
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                  />
                </div>

                <div className="border-t border-white/10 pt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="sharpen-range"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Keskinlik ({sharpen})
                    </Label>
                    <Input
                      id="sharpen-range"
                      type="range"
                      min={0}
                      max={100}
                      value={sharpen}
                      onChange={(e) => setSharpen(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="blur-range"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Bulanıklık ({blur.toFixed(1)})
                    </Label>
                    <Input
                      id="blur-range"
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={blur}
                      onChange={(e) => setBlur(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="vignette-range"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Vinyet ({vignette})
                    </Label>
                    <Input
                      id="vignette-range"
                      type="range"
                      min={0}
                      max={100}
                      value={vignette}
                      onChange={(e) => setVignette(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="temperature-range"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Renk Sıcaklığı (
                      {temperature > 0
                        ? `+${temperature} Sıcak`
                        : temperature < 0
                          ? `${temperature} Soğuk`
                          : "Nötr"}
                      )
                    </Label>
                    <Input
                      id="temperature-range"
                      type="range"
                      min={-100}
                      max={100}
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="gamma-range"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Gamma ({gamma.toFixed(2)})
                    </Label>
                    <Input
                      id="gamma-range"
                      type="range"
                      min={0.5}
                      max={3.0}
                      step={0.05}
                      value={gamma}
                      onChange={(e) => setGamma(Number(e.target.value))}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* === OVERLAY TAB === */}
              <TabsContent value="overlay" className="space-y-3 mt-3">
                <div className="flex items-center gap-2">
                  <input
                    id="watermarkEnabled"
                    type="checkbox"
                    aria-label="Filigranı etkinleştir"
                    title="Filigranı etkinleştir"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="accent-[var(--arvesta-accent)]"
                  />
                  <Label
                    htmlFor="watermarkEnabled"
                    className="text-sm text-[var(--arvesta-text-secondary)]"
                  >
                    Filigran (Watermark)
                  </Label>
                </div>

                {watermarkEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-md border border-white/5">
                        <input
                          type="radio"
                          id="wm-text"
                          name="wmType"
                          value="text"
                          aria-label="Yazı filigranı"
                          title="Yazı filigranı"
                          checked={watermarkType === "text"}
                          onChange={() => setWatermarkType("text")}
                          className="accent-[var(--arvesta-accent)]"
                        />
                        <Label
                          htmlFor="wm-text"
                          className="text-xs text-white cursor-pointer"
                        >
                          Yazı
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-md border border-white/5">
                        <input
                          type="radio"
                          id="wm-logo"
                          name="wmType"
                          value="logo"
                          aria-label="Logo filigranı"
                          title="Logo filigranı"
                          checked={watermarkType === "logo"}
                          onChange={() => setWatermarkType("logo")}
                          className="accent-[var(--arvesta-accent)]"
                        />
                        <Label
                          htmlFor="wm-logo"
                          className="text-xs text-white cursor-pointer"
                        >
                          Logo (Arvesta)
                        </Label>
                      </div>
                    </div>

                    {watermarkType === "text" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-[var(--arvesta-text-secondary)]">
                          Filigran Metni
                        </Label>
                        <Input
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="ARVESTA"
                          className="text-sm h-9"
                        />
                      </div>
                    )}
                    <Label
                      htmlFor="watermark-position"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Filigran Konumu
                    </Label>
                    <select
                      id="watermark-position"
                      aria-label="Filigran konumu"
                      title="Filigran konumu"
                      value={watermarkPosition}
                      onChange={(e) =>
                        setWatermarkPosition(
                          e.target.value as
                            | "top-left"
                            | "top-right"
                            | "bottom-left"
                            | "bottom-right"
                            | "center",
                        )
                      }
                      className="w-full h-10 px-3 bg-[var(--arvesta-bg-elevated)] border border-white/10 rounded-md text-sm"
                    >
                      <option value="top-left">Sol Üst</option>
                      <option value="top-right">Sağ Üst</option>
                      <option value="bottom-left">Sol Alt</option>
                      <option value="bottom-right">Sağ Alt</option>
                      <option value="center">Orta</option>
                    </select>

                    <div className="space-y-1">
                      <Label
                        htmlFor="watermark-opacity"
                        className="text-xs text-[var(--arvesta-text-secondary)]"
                      >
                        Filigran Opaklığı ({watermarkOpacity.toFixed(2)})
                      </Label>
                      <Input
                        id="watermark-opacity"
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={watermarkOpacity}
                        onChange={(e) =>
                          setWatermarkOpacity(Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="watermark-scale"
                        className="text-xs text-[var(--arvesta-text-secondary)]"
                      >
                        Filigran Boyutu ({watermarkScale.toFixed(2)})
                      </Label>
                      <Input
                        id="watermark-scale"
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={watermarkScale}
                        onChange={(e) =>
                          setWatermarkScale(Number(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-[var(--arvesta-text-secondary)]">
                      Metin Ekle
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTextOverlays((p) => [...p, defaultOverlay()])
                      }
                    >
                      Ekle
                    </Button>
                  </div>

                  {textOverlays.map((overlay, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 mb-3 p-2 rounded-md border border-white/10"
                    >
                      <Input
                        value={overlay.text}
                        onChange={(e) =>
                          setTextOverlays((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, text: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Metin"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          value={overlay.x}
                          onChange={(e) =>
                            setTextOverlays((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, x: Number(e.target.value) }
                                  : item,
                              ),
                            )
                          }
                          placeholder="X"
                        />
                        <Input
                          type="number"
                          value={overlay.y}
                          onChange={(e) =>
                            setTextOverlays((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, y: Number(e.target.value) }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Y"
                        />
                        <Input
                          type="number"
                          value={overlay.size}
                          onChange={(e) =>
                            setTextOverlays((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, size: Number(e.target.value) }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Boyut"
                        />
                        <Input
                          type="color"
                          value={overlay.color}
                          onChange={(e) =>
                            setTextOverlays((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, color: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() =>
                          setTextOverlays((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Kaldır
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* === DEPTH TAB === */}
              <TabsContent value="depth" className="space-y-3 mt-3">
                <Button
                  type="button"
                  className="w-full bg-[var(--arvesta-accent)] text-black hover:bg-opacity-90"
                  onClick={handleGenerateDepthMap}
                  disabled={depthLoading || !tempId}
                >
                  {depthLoading
                    ? "Oluşturuluyor..."
                    : "Derinlik Haritası Oluştur"}
                </Button>
                {depthError && (
                  <p className="text-xs text-red-400">{depthError}</p>
                )}
                {depthMapUrl && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="depth-intensity"
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Parallax Yoğunluğu ({depthIntensity})
                    </Label>
                    <Input
                      id="depth-intensity"
                      type="range"
                      min={0}
                      max={100}
                      value={depthIntensity}
                      onChange={(e) =>
                        setDepthIntensity(Number(e.target.value))
                      }
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="px-5 pb-5 pt-0 bg-transparent border-none -mx-0 -mb-0">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-[var(--arvesta-text-secondary)]"
            onClick={() => {
              onOpenChange(false);
              resetState();
              onClose?.();
            }}
          >
            İptal
          </Button>
          <Button
            type="button"
            className="bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)]"
            onClick={handlePublish}
            disabled={saving || !tempId}
          >
            {saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
