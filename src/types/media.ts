export type MediaWatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export interface MediaTextOverlay {
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // px
  color: string; // hex
  opacity: number; // 0-1
  weight: number; // 100-900
}

export interface DepthParallaxConfig {
  enabled: boolean;
  depthMapTempId: string;
  depthMapUrl?: string;
  intensity: number; // 0-100
  zoom?: number; // 0.5-3.0
  focusPoint?: { x: number; y: number }; // 0-100
  fogEnabled?: boolean;
  fogDensity?: number; // 0-100
  fogColor?: string; // hex
  rotationEnabled?: boolean;
  rotationX?: number; // -30..30
  rotationY?: number; // -30..30
  depthColorize?: boolean;
  depthColorFrom?: string; // hex
  depthColorTo?: string; // hex
}

export interface MediaEditRecipe {
  crop?: {
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  rotate?: 0 | 90 | 180 | 270;
  flip?: boolean;
  flop?: boolean;
  quality?: number; // 1-100
  brightness?: number; // -100..100
  contrast?: number; // -100..100
  saturation?: number; // -100..100
  sharpen?: number; // 0..100  (0 = off)
  blur?: number; // 0..20  (0 = off, sigma value)
  vignette?: number; // 0..100  (0 = off)
  temperature?: number; // -100..100  (warm/cool)
  gamma?: number; // 0.5..3.0  (1.0 = neutral)
  autoEnhance?: boolean;
  watermark?: {
    enabled: boolean;
    type?: "text" | "logo";
    text?: string;
    position: MediaWatermarkPosition;
    opacity: number; // 0..1
    scale: number; // 0..1
  };
  textOverlays?: MediaTextOverlay[];
  format?: "jpg" | "png" | "webp";
  depthParallax?: DepthParallaxConfig;
}
