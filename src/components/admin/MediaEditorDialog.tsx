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
          <DialogTitle className="font-ui">Traitement d&apos;image</DialogTitle>
          <DialogDescription className="text-(--arvesta-text-muted)">
            Appliquez les modifications, puis enregistrez pour publier.
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
                          className="absolute pointer-events-none"
                          style={{
                            inset: 0,
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
                                alt="Filigrane logo"
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
                        alt="Aperçu"
                        width={0}
                        height={0}
                        sizes="100vw"
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
                              alt="Aperçu du filigrane logo Arvesta"
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
                Aperçu non disponible
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
                  Base
                </TabsTrigger>
                <TabsTrigger
                  value="crop"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Recadrer
                </TabsTrigger>
                <TabsTrigger
                  value="style"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Style
                </TabsTrigger>
                <TabsTrigger
                  value="overlay"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Calque
                </TabsTrigger>
                <TabsTrigger
                  value="depth"
                  className="text-[11px] sm:text-xs px-1.5 py-1.5"
                >
                  Profondeur
                </TabsTrigger>
              </TabsList>

              {/* === BASIC TAB === */}
              <TabsContent value="basic" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-(--arvesta-text-secondary)">
                    Rotation
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
                    ↕ Miroir V
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
                    ↔ Miroir H
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="quality-range"
                    className="text-xs text-(--arvesta-text-secondary)"
                  >
                    Qualité ({quality})
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
                    aria-label="Activer l'amélioration automatique"
                    title="Activer l'amélioration automatique"
                    checked={autoEnhance}
                    onChange={(e) => setAutoEnhance(e.target.checked)}
                    className="accent-(--arvesta-accent)"
                  />
                  <Label
                    htmlFor="autoEnhance"
                    className="text-sm text-(--arvesta-text-secondary)"
                  >
                    Amélioration auto
                  </Label>
                </div>
              </TabsContent>

              {/* === CROP TAB === */}
              <TabsContent value="crop" className="space-y-3 mt-3">
                <div className="text-xs text-(--arvesta-text-muted) mb-2">
                  Vous pouvez aussi glisser le cadre directement sur
                  l&apos;image.
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
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Largeur (%)
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
                      className="text-xs text-[var(--arvesta-text-secondary)]"
                    >
                      Hauteur (%)
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
                  className="w-full mt-4 bg-[var(--arvesta-accent)] text-black hover:bg-opacity-90"
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
                  {cropApplied
                    ? "✓ Recadrage confirmé"
                    : "Confirmer le recadrage"}
                </Button>
                {cropApplied && (
                  <p className="text-xs text-emerald-300">
                    Recadrage appliqué. Il sera traité lors de
                    l&apos;enregistrement.
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
                    Réinitialiser
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="brightness-range"
                    className="text-xs text-[var(--arvesta-text-secondary)]"
                  >
                    Luminosité ({brightness})
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
                    Contraste ({contrast})
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
                    Saturation ({saturation})
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
                      Netteté ({sharpen})
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
                      Flou ({blur.toFixed(1)})
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
                      Vignette ({vignette})
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
                      Température (
                      {temperature > 0
                        ? `+${temperature} Chaud`
                        : temperature < 0
                          ? `${temperature} Froid`
                          : "Neutre"}
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
                    aria-label="Activer le filigrane"
                    title="Activer le filigrane"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="accent-[var(--arvesta-accent)]"
                  />
                  <Label
                    htmlFor="watermarkEnabled"
                    className="text-sm text-[var(--arvesta-text-secondary)]"
                  >
                    Filigrane (Watermark)
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
                          aria-label="Filigrane texte"
                          title="Filigrane texte"
                          checked={watermarkType === "text"}
                          onChange={() => setWatermarkType("text")}
                          className="accent-[var(--arvesta-accent)]"
                        />
                        <Label
                          htmlFor="wm-text"
                          className="text-xs text-white cursor-pointer"
                        >
                          Texte
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-md border border-white/5">
                        <input
                          type="radio"
                          id="wm-logo"
                          name="wmType"
                          value="logo"
                          aria-label="Filigrane logo"
                          title="Filigrane logo"
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
                          Texte du filigrane
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
                      Position du filigrane
                    </Label>
                    <select
                      id="watermark-position"
                      aria-label="Position du filigrane"
                      title="Position du filigrane"
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
                      <option value="top-left">Haut gauche</option>
                      <option value="top-right">Haut droit</option>
                      <option value="bottom-left">Bas gauche</option>
                      <option value="bottom-right">Bas droit</option>
                      <option value="center">Centre</option>
                    </select>

                    <div className="space-y-1">
                      <Label
                        htmlFor="watermark-opacity"
                        className="text-xs text-[var(--arvesta-text-secondary)]"
                      >
                        Opacité du filigrane ({watermarkOpacity.toFixed(2)})
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
                        Taille du filigrane ({watermarkScale.toFixed(2)})
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
                      Ajouter du texte
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTextOverlays((p) => [...p, defaultOverlay()])
                      }
                    >
                      Ajouter
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
                          placeholder="Taille"
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
                        Supprimer
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
                    ? "Génération..."
                    : "Générer la carte de profondeur"}
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
                      Intensité parallax ({depthIntensity})
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
                        className="text-xs text-[var(--arvesta-text-secondary)]"
                      >
                        Zoom ({depthZoom.toFixed(1)}×)
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
                          className="text-xs text-[var(--arvesta-text-secondary)]"
                        >
                          Point focal X ({depthFocusX}%)
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
                          className="text-xs text-[var(--arvesta-text-secondary)]"
                        >
                          Point focal Y ({depthFocusY}%)
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
                          aria-label="Activer la rotation 3D"
                          title="Activer la rotation 3D"
                          checked={depthRotationEnabled}
                          onChange={(e) =>
                            setDepthRotationEnabled(e.target.checked)
                          }
                          className="accent-[var(--arvesta-accent)]"
                        />
                        <Label
                          htmlFor="depth-rotation-toggle"
                          className="text-sm text-[var(--arvesta-text-secondary)]"
                        >
                          Rotation 3D
                        </Label>
                      </div>
                      {depthRotationEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-rot-x"
                              className="text-xs text-[var(--arvesta-text-secondary)]"
                            >
                              Rotation X ({depthRotationX}°)
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
                              className="text-xs text-[var(--arvesta-text-secondary)]"
                            >
                              Rotation Y ({depthRotationY}°)
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
                          aria-label="Activer le brouillard"
                          title="Activer le brouillard"
                          checked={depthFogEnabled}
                          onChange={(e) => setDepthFogEnabled(e.target.checked)}
                          className="accent-[var(--arvesta-accent)]"
                        />
                        <Label
                          htmlFor="depth-fog-toggle"
                          className="text-sm text-[var(--arvesta-text-secondary)]"
                        >
                          Brouillard
                        </Label>
                      </div>
                      {depthFogEnabled && (
                        <div className="space-y-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-fog-density"
                              className="text-xs text-[var(--arvesta-text-secondary)]"
                            >
                              Densité ({depthFogDensity})
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
                              className="text-xs text-[var(--arvesta-text-secondary)]"
                            >
                              Couleur du brouillard
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
                          aria-label="Activer la colorisation de profondeur"
                          title="Activer la colorisation de profondeur"
                          checked={depthColorize}
                          onChange={(e) => setDepthColorize(e.target.checked)}
                          className="accent-[var(--arvesta-accent)]"
                        />
                        <Label
                          htmlFor="depth-colorize-toggle"
                          className="text-sm text-[var(--arvesta-text-secondary)]"
                        >
                          Colorisation profondeur
                        </Label>
                      </div>
                      {depthColorize && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="depth-color-from"
                              className="text-xs text-[var(--arvesta-text-secondary)]"
                            >
                              Couleur proche
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
                              className="text-xs text-[var(--arvesta-text-secondary)]"
                            >
                              Couleur lointaine
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
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)]"
            onClick={handlePublish}
            disabled={saving || !tempId}
          >
            {saving ? "Enregistrement..." : "Enregistrer et publier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
