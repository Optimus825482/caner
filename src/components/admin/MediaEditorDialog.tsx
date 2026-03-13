"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("adminMediaEditor");
  const isTempPreview = Boolean(previewUrl?.startsWith("/api/media/temp/"));

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

  // 3D depth controls
  const [depthZoom, setDepthZoom] = useState(1.0);
  const [depthFocusX, setDepthFocusX] = useState(50);
  const [depthFocusY, setDepthFocusY] = useState(50);
  const [depthFogEnabled, setDepthFogEnabled] = useState(false);
  const [depthFogDensity, setDepthFogDensity] = useState(0);
  const [depthFogColor, setDepthFogColor] = useState("#1a1a2e");
  const [depthRotationEnabled, setDepthRotationEnabled] = useState(false);
  const [depthRotationX, setDepthRotationX] = useState(0);
  const [depthRotationY, setDepthRotationY] = useState(0);
  const [depthColorize, setDepthColorize] = useState(false);
  const [depthColorFrom, setDepthColorFrom] = useState("#000033");
  const [depthColorTo, setDepthColorTo] = useState("#ffcc00");

  const previewFilter = useMemo(() => {
    const b = 100 + brightness;
    const c = 100 + contrast;
    const s = 100 + saturation;
    const blurPx = blur > 0 ? `${blur}` : "0";
    return `${b}-${c}-${s}-${blurPx}`;
  }, [brightness, contrast, saturation, blur]);

  const transformClass = useMemo(() => {
    const rotateClass =
      rotate === 90
        ? "rotate-90"
        : rotate === 180
          ? "rotate-180"
          : rotate === 270
            ? "rotate-270"
            : "rotate-0";

    return [
      rotateClass,
      flip ? "-scale-y-100" : "scale-y-100",
      flop ? "-scale-x-100" : "scale-x-100",
    ].join(" ");
  }, [rotate, flip, flop]);

  const watermarkPositionClass = useMemo(() => {
    switch (watermarkPosition) {
      case "top-left":
        return "items-start justify-start";
      case "top-right":
        return "items-start justify-end";
      case "bottom-left":
        return "items-end justify-start";
      case "center":
        return "items-center justify-center";
      default:
        return "items-end justify-end";
    }
  }, [watermarkPosition]);

  const watermarkOpacityClass = useMemo(() => {
    if (watermarkOpacity >= 0.9) return "opacity-100";
    if (watermarkOpacity >= 0.8) return "opacity-90";
    if (watermarkOpacity >= 0.7) return "opacity-80";
    if (watermarkOpacity >= 0.6) return "opacity-70";
    if (watermarkOpacity >= 0.5) return "opacity-60";
    if (watermarkOpacity >= 0.4) return "opacity-50";
    if (watermarkOpacity >= 0.3) return "opacity-40";
    return "opacity-30";
  }, [watermarkOpacity]);

  const watermarkLogoSizeClass = useMemo(() => {
    if (watermarkScale >= 0.8) return "w-56";
    if (watermarkScale >= 0.6) return "w-48";
    if (watermarkScale >= 0.5) return "w-40";
    if (watermarkScale >= 0.4) return "w-32";
    if (watermarkScale >= 0.3) return "w-28";
    return "w-24";
  }, [watermarkScale]);

  const watermarkTextSizeClass = useMemo(() => {
    if (watermarkScale >= 0.8) return "text-4xl";
    if (watermarkScale >= 0.6) return "text-3xl";
    if (watermarkScale >= 0.5) return "text-2xl";
    if (watermarkScale >= 0.4) return "text-xl";
    if (watermarkScale >= 0.3) return "text-lg";
    return "text-base";
  }, [watermarkScale]);

  const vignetteOpacityClass = useMemo(() => {
    if (vignette >= 80) return "opacity-80";
    if (vignette >= 60) return "opacity-60";
    if (vignette >= 40) return "opacity-40";
    if (vignette >= 20) return "opacity-25";
    return "opacity-0";
  }, [vignette]);

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
    setDepthZoom(1.0);
    setDepthFocusX(50);
    setDepthFocusY(50);
    setDepthFogEnabled(false);
    setDepthFogDensity(0);
    setDepthFogColor("#1a1a2e");
    setDepthRotationEnabled(false);
    setDepthRotationX(0);
    setDepthRotationY(0);
    setDepthColorize(false);
    setDepthColorFrom("#000033");
    setDepthColorTo("#ffcc00");
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
      <DialogContent className="w-[95vw] sm:max-w-[95vw] xl:max-w-350 h-[90vh] bg-(--arvesta-bg-card) border border-white/10 text-white p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-2 shrink-0">
          <DialogTitle className="font-ui">{t("title")}</DialogTitle>
          <DialogDescription className="text-(--arvesta-text-muted)">
            {t("description")}
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
                    zoom={depthZoom}
                    focusPoint={{ x: depthFocusX, y: depthFocusY }}
                    fogEnabled={depthFogEnabled}
                    fogDensity={depthFogDensity}
                    fogColor={depthFogColor}
                    rotationEnabled={depthRotationEnabled}
                    rotationX={depthRotationX}
                    rotationY={depthRotationY}
                    depthColorize={depthColorize}
                    depthColorFrom={depthColorFrom}
                    depthColorTo={depthColorTo}
                    className="max-w-full max-h-[calc(90vh-140px)] object-contain rounded-lg shadow-2xl"
                    watermarkOverlay={
                      watermarkEnabled ? (
                        <div
                          className={`absolute inset-0 pointer-events-none flex p-[3%] ${watermarkPositionClass}`}
                        >
                          {watermarkType === "logo" ? (
                            <div
                              className={`flex items-center justify-center rounded-full flex-col shadow-xl aspect-square bg-black/45 ${watermarkOpacityClass} ${watermarkLogoSizeClass}`}
                            >
                              <Image
                                src="/logo.png"
                                alt={t("logoAlt")}
                                width={220}
                                height={220}
                                className={`h-auto w-[70%] object-contain ${watermarkOpacityClass}`}
                              />
                            </div>
                          ) : (
                            <div
                              className={`text-white font-bold flex items-center justify-center rounded-xl p-2 md:p-4 shadow-xl text-center max-w-[85%] wrap-break-word whitespace-normal tracking-[2px] bg-black/45 ${watermarkOpacityClass} ${watermarkTextSizeClass}`}
                            >
                              {watermarkText || "ARVESTA"}
                            </div>
                          )}
                        </div>
                      ) : undefined
                    }
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
                      <Image
                        src={previewUrl}
                        alt={t("noPreview")}
                        width={0}
                        height={0}
                        sizes="100vw"
                        unoptimized={isTempPreview}
                        className={`max-w-full max-h-[calc(90vh-140px)] object-contain rounded-lg shadow-2xl origin-center transition-transform ${transformClass}`}
                        data-preview-filter={previewFilter}
                      />
                    </ReactCrop>

                    {/* Vignette preview */}
                    {vignette > 0 && (
                      <div
                        className={`absolute inset-0 pointer-events-none rounded-lg bg-radial from-transparent via-transparent to-black ${vignetteOpacityClass}`}
                      />
                    )}

                    {/* Watermark Live Preview */}
                    {watermarkEnabled && (
                      <div
                        className={`absolute inset-0 pointer-events-none flex p-[3%] ${watermarkPositionClass} ${transformClass}`}
                      >
                        {watermarkType === "logo" ? (
                          <div
                            className={`flex items-center justify-center rounded-full flex-col shadow-xl aspect-square bg-black/45 ${watermarkOpacityClass} ${watermarkLogoSizeClass}`}
                          >
                            <Image
                              src="/logo.png"
                              alt={t("logoAlt")}
                              width={220}
                              height={220}
                              className={`h-auto w-[70%] object-contain ${watermarkOpacityClass}`}
                            />
                          </div>
                        ) : (
                          <div
                            className={`text-white font-bold flex items-center justify-center rounded-xl p-2 md:p-4 shadow-xl text-center max-w-[85%] wrap-break-word whitespace-normal tracking-[2px] bg-black/45 ${watermarkOpacityClass} ${watermarkTextSizeClass}`}
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
              <div className="h-full w-full flex items-center justify-center text-(--arvesta-text-muted)">
                {t("noPreview")}
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
              <TabsList className="bg-(--arvesta-bg-elevated) border border-white/10 w-full grid grid-cols-2 sm:grid-cols-5 gap-1 h-auto p-1">
                <TabsTrigger
                  value="basic"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  {t("tabBasic")}
                </TabsTrigger>
                <TabsTrigger
                  value="crop"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  {t("tabCrop")}
                </TabsTrigger>
                <TabsTrigger
                  value="style"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  {t("tabStyle")}
                </TabsTrigger>
                <TabsTrigger
                  value="overlay"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  {t("tabOverlay")}
                </TabsTrigger>
                <TabsTrigger
                  value="depth"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  {t("tabDepth")}
                </TabsTrigger>
              </TabsList>

              {/* === BASIC TAB === */}
              <TabsContent value="basic" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-(--arvesta-text-secondary)">
                    {t("rotate")}
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
                            ? "bg-(--arvesta-accent)"
                            : "border-white/10 text-(--arvesta-text-secondary)"
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
                        ? "bg-(--arvesta-accent)"
                        : "border-white/10 text-(--arvesta-text-secondary)"
                    }
                    onClick={() => setFlip(!flip)}
                  >
                    {t("flipV")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={flop ? "default" : "outline"}
                    className={
                      flop
                        ? "bg-(--arvesta-accent)"
                        : "border-white/10 text-(--arvesta-text-secondary)"
                    }
                    onClick={() => setFlop(!flop)}
                  >
                    {t("flipH")}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="quality-range"
                    className="text-xs text-(--arvesta-text-secondary)"
                  >
                    {t("quality")} ({quality})
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
                    aria-label={t("autoEnhanceAria")}
                    title={t("autoEnhanceAria")}
                    checked={autoEnhance}
                    onChange={(e) => setAutoEnhance(e.target.checked)}
                    className="accent-(--arvesta-accent)"
                  />
                  <Label
                    htmlFor="autoEnhance"
                    className="text-sm text-(--arvesta-text-secondary)"
                  >
                    {t("autoEnhance")}
                  </Label>
                </div>
              </TabsContent>

              {/* === CROP TAB === */}
              <TabsContent value="crop" className="space-y-3 mt-3">
                <div className="text-xs text-(--arvesta-text-muted) mb-2">
                  {t("cropHint")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-x"
                      className="text-xs text-(--arvesta-text-secondary)"
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
                        setCropObj({
                          unit: "%",
                          x: next,
                          y: cropY,
                          width: cropW,
                          height: cropH,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-y"
                      className="text-xs text-(--arvesta-text-secondary)"
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
                        setCropObj({
                          unit: "%",
                          x: cropX,
                          y: next,
                          width: cropW,
                          height: cropH,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-width"
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {`${t("cropWidth")} (%)`}
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
                        setCropObj({
                          unit: "%",
                          x: cropX,
                          y: cropY,
                          width: next,
                          height: cropH,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="crop-height"
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {`${t("cropHeight")} (%)`}
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
                        setCropObj({
                          unit: "%",
                          x: cropX,
                          y: cropY,
                          width: cropW,
                          height: next,
                        });
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full mt-4 bg-(--arvesta-accent) text-black hover:bg-opacity-90"
                  onClick={() => {
                    setAppliedCrop({
                      x: clampPercent(cropX, 0, 100),
                      y: clampPercent(cropY, 0, 100),
                      width: clampPercent(cropW, 1, 100),
                      height: clampPercent(cropH, 1, 100),
                    });
                    setCropApplied(true);
                  }}
                >
                  {cropApplied ? t("cropConfirmed") : t("cropConfirm")}
                </Button>
                {cropApplied && (
                  <p className="text-xs text-emerald-300">{t("cropApplied")}</p>
                )}
              </TabsContent>

              {/* === STYLE TAB === */}
              <TabsContent value="style" className="space-y-3 mt-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-xs text-(--arvesta-text-muted) hover:text-white"
                    onClick={resetStyleToDefaults}
                  >
                    {t("reset")}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="brightness-range"
                    className="text-xs text-(--arvesta-text-secondary)"
                  >
                    {t("brightness")} ({brightness})
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
                    className="text-xs text-(--arvesta-text-secondary)"
                  >
                    {t("contrast")} ({contrast})
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
                    className="text-xs text-(--arvesta-text-secondary)"
                  >
                    {t("saturation")} ({saturation})
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
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("sharpness")} ({sharpen})
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
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("blur")} ({blur.toFixed(1)})
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
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("vignette")} ({vignette})
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
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("temperature")} (
                      {temperature > 0
                        ? `+${temperature} ${t("tempWarm")}`
                        : temperature < 0
                          ? `${temperature} ${t("tempCold")}`
                          : t("tempNeutral")}
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
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("gamma")} ({gamma.toFixed(2)})
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
                    aria-label={t("watermarkAria")}
                    title={t("watermarkAria")}
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="accent-(--arvesta-accent)"
                  />
                  <Label
                    htmlFor="watermarkEnabled"
                    className="text-sm text-(--arvesta-text-secondary)"
                  >
                    {t("watermark")}
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
                          aria-label={t("watermarkTextAria")}
                          title={t("watermarkTextAria")}
                          checked={watermarkType === "text"}
                          onChange={() => setWatermarkType("text")}
                          className="accent-(--arvesta-accent)"
                        />
                        <Label
                          htmlFor="wm-text"
                          className="text-xs text-white cursor-pointer"
                        >
                          {t("watermarkText")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-md border border-white/5">
                        <input
                          type="radio"
                          id="wm-logo"
                          name="wmType"
                          value="logo"
                          aria-label={t("watermarkLogoAria")}
                          title={t("watermarkLogoAria")}
                          checked={watermarkType === "logo"}
                          onChange={() => setWatermarkType("logo")}
                          className="accent-(--arvesta-accent)"
                        />
                        <Label
                          htmlFor="wm-logo"
                          className="text-xs text-white cursor-pointer"
                        >
                          {t("watermarkLogo")}
                        </Label>
                      </div>
                    </div>

                    {watermarkType === "text" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-(--arvesta-text-secondary)">
                          {t("watermarkContent")}
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
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("watermarkPosition")}
                    </Label>
                    <select
                      id="watermark-position"
                      aria-label={t("watermarkPositionAria")}
                      title={t("watermarkPositionAria")}
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
                      className="w-full h-10 px-3 bg-(--arvesta-bg-elevated) border border-white/10 rounded-md text-sm"
                    >
                      <option value="top-left">{t("posTopLeft")}</option>
                      <option value="top-right">{t("posTopRight")}</option>
                      <option value="bottom-left">{t("posBottomLeft")}</option>
                      <option value="bottom-right">
                        {t("posBottomRight")}
                      </option>
                      <option value="center">{t("posCenter")}</option>
                    </select>

                    <div className="space-y-1">
                      <Label
                        htmlFor="watermark-opacity"
                        className="text-xs text-(--arvesta-text-secondary)"
                      >
                        {t("watermarkOpacity")} ({watermarkOpacity.toFixed(2)})
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
                        className="text-xs text-(--arvesta-text-secondary)"
                      >
                        {t("watermarkSize")} ({watermarkScale.toFixed(2)})
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
                    <Label className="text-sm text-(--arvesta-text-secondary)">
                      {t("addText")}
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTextOverlays((p) => [...p, defaultOverlay()])
                      }
                    >
                      {t("add")}
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
                        placeholder={t("textPlaceholder")}
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
                          placeholder={t("sizePlaceholder")}
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
                        {t("remove")}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* === DEPTH TAB === */}
              <TabsContent value="depth" className="space-y-3 mt-3">
                <Button
                  type="button"
                  className="w-full bg-(--arvesta-accent) text-black hover:bg-opacity-90"
                  onClick={handleGenerateDepthMap}
                  disabled={depthLoading || !tempId}
                >
                  {depthLoading ? t("generatingDepth") : t("generateDepth")}
                </Button>
                {depthError && (
                  <p className="text-xs text-red-400">{depthError}</p>
                )}
                {depthMapUrl && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="depth-intensity"
                      className="text-xs text-(--arvesta-text-secondary)"
                    >
                      {t("depthIntensity")} ({depthIntensity})
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

                {/* 3D Controls — visible only when depth map exists */}
                {depthMapUrl && (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    {/* Zoom */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="depth-zoom"
                        className="text-xs text-(--arvesta-text-secondary)"
                      >
                        {t("depthZoom")} ({depthZoom.toFixed(1)}×)
                      </Label>
                      <Input
                        id="depth-zoom"
                        type="range"
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        value={depthZoom}
                        onChange={(e) => setDepthZoom(Number(e.target.value))}
                      />
                    </div>

                    {/* Focus Point */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="depth-focus-x"
                          className="text-xs text-(--arvesta-text-secondary)"
                        >
                          {t("depthFocusX")} ({depthFocusX}%)
                        </Label>
                        <Input
                          id="depth-focus-x"
                          type="range"
                          min={0}
                          max={100}
                          value={depthFocusX}
                          onChange={(e) =>
                            setDepthFocusX(Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="depth-focus-y"
                          className="text-xs text-(--arvesta-text-secondary)"
                        >
                          {t("depthFocusY")} ({depthFocusY}%)
                        </Label>
                        <Input
                          id="depth-focus-y"
                          type="range"
                          min={0}
                          max={100}
                          value={depthFocusY}
                          onChange={(e) =>
                            setDepthFocusY(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    {/* Rotation */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id="depth-rotation-toggle"
                          type="checkbox"
                          aria-label={t("depthRotation3DAria")}
                          title={t("depthRotation3DAria")}
                          checked={depthRotationEnabled}
                          onChange={(e) =>
                            setDepthRotationEnabled(e.target.checked)
                          }
                          className="accent-(--arvesta-accent)"
                        />
                        <Label
                          htmlFor="depth-rotation-toggle"
                          className="text-sm text-(--arvesta-text-secondary)"
                        >
                          {t("depthRotation3D")}
                        </Label>
                      </div>
                      {depthRotationEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-rot-x"
                              className="text-xs text-(--arvesta-text-secondary)"
                            >
                              {t("depthRotationX")} ({depthRotationX}°)
                            </Label>
                            <Input
                              id="depth-rot-x"
                              type="range"
                              min={-30}
                              max={30}
                              value={depthRotationX}
                              onChange={(e) =>
                                setDepthRotationX(Number(e.target.value))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-rot-y"
                              className="text-xs text-(--arvesta-text-secondary)"
                            >
                              {t("depthRotationY")} ({depthRotationY}°)
                            </Label>
                            <Input
                              id="depth-rot-y"
                              type="range"
                              min={-30}
                              max={30}
                              value={depthRotationY}
                              onChange={(e) =>
                                setDepthRotationY(Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fog */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id="depth-fog-toggle"
                          type="checkbox"
                          aria-label={t("depthFogAria")}
                          title={t("depthFogAria")}
                          checked={depthFogEnabled}
                          onChange={(e) => setDepthFogEnabled(e.target.checked)}
                          className="accent-(--arvesta-accent)"
                        />
                        <Label
                          htmlFor="depth-fog-toggle"
                          className="text-sm text-(--arvesta-text-secondary)"
                        >
                          {t("depthFog")}
                        </Label>
                      </div>
                      {depthFogEnabled && (
                        <div className="space-y-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-fog-density"
                              className="text-xs text-(--arvesta-text-secondary)"
                            >
                              {t("depthFogDensity")} ({depthFogDensity})
                            </Label>
                            <Input
                              id="depth-fog-density"
                              type="range"
                              min={0}
                              max={100}
                              value={depthFogDensity}
                              onChange={(e) =>
                                setDepthFogDensity(Number(e.target.value))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-fog-color"
                              className="text-xs text-(--arvesta-text-secondary)"
                            >
                              {t("depthFogColor")}
                            </Label>
                            <Input
                              id="depth-fog-color"
                              type="color"
                              value={depthFogColor}
                              onChange={(e) => setDepthFogColor(e.target.value)}
                              className="h-9 w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Depth Colorize */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id="depth-colorize-toggle"
                          type="checkbox"
                          aria-label={t("depthColorizationAria")}
                          title={t("depthColorizationAria")}
                          checked={depthColorize}
                          onChange={(e) => setDepthColorize(e.target.checked)}
                          className="accent-(--arvesta-accent)"
                        />
                        <Label
                          htmlFor="depth-colorize-toggle"
                          className="text-sm text-(--arvesta-text-secondary)"
                        >
                          {t("depthColorization")}
                        </Label>
                      </div>
                      {depthColorize && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-color-from"
                              className="text-xs text-(--arvesta-text-secondary)"
                            >
                              {t("depthColorNear")}
                            </Label>
                            <Input
                              id="depth-color-from"
                              type="color"
                              value={depthColorFrom}
                              onChange={(e) =>
                                setDepthColorFrom(e.target.value)
                              }
                              className="h-9 w-full"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-color-to"
                              className="text-xs text-(--arvesta-text-secondary)"
                            >
                              {t("depthColorFar")}
                            </Label>
                            <Input
                              id="depth-color-to"
                              type="color"
                              value={depthColorTo}
                              onChange={(e) => setDepthColorTo(e.target.value)}
                              className="h-9 w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="px-5 pb-5 pt-0 bg-transparent border-none mx-0 mb-0">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-(--arvesta-text-secondary)"
            onClick={() => {
              onOpenChange(false);
              resetState();
              onClose?.();
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover)"
            onClick={handlePublish}
            disabled={saving || !tempId}
          >
            {saving ? t("savingPublish") : t("savePublish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
