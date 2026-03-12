import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { copyFile, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  getPublicUploadDir,
  resolveTempFileById,
} from "@/lib/media-preprocess";
import type { MediaEditRecipe, MediaTextOverlay } from "@/types/media";

const recipeSchema = z.object({
  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  rotate: z
    .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
    .optional(),
  flip: z.boolean().optional(),
  flop: z.boolean().optional(),
  quality: z.number().int().min(1).max(100).optional(),
  brightness: z.number().min(-100).max(100).optional(),
  contrast: z.number().min(-100).max(100).optional(),
  saturation: z.number().min(-100).max(100).optional(),
  sharpen: z.number().min(0).max(100).optional(),
  blur: z.number().min(0).max(20).optional(),
  vignette: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-100).max(100).optional(),
  gamma: z.number().min(0.5).max(3.0).optional(),
  autoEnhance: z.boolean().optional(),
  watermark: z
    .object({
      enabled: z.boolean(),
      type: z.enum(["text", "logo"]).optional(),
      text: z.string().optional(),
      position: z.enum([
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "center",
      ]),
      opacity: z.number().min(0).max(1),
      scale: z.number().min(0.1).max(1),
    })
    .optional(),
  textOverlays: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(120),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        size: z.number().min(8).max(240),
        color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
        opacity: z.number().min(0).max(1),
        weight: z.number().int().min(100).max(900),
      }),
    )
    .max(10)
    .optional(),
  format: z.enum(["jpg", "png", "webp"]).optional(),
  depthParallax: z
    .object({
      enabled: z.boolean(),
      depthMapTempId: z.string().trim().min(1),
      intensity: z.number().int().min(0).max(100),
    })
    .optional(),
});

const publishSchema = z.object({
  tempId: z.string().trim().min(1),
  recipe: recipeSchema,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function textOverlayToSvg(
  width: number,
  height: number,
  overlays: MediaTextOverlay[],
) {
  const textNodes = overlays
    .map((overlay) => {
      const x = (overlay.x / 100) * width;
      const y = (overlay.y / 100) * height;
      const escaped = overlay.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      // Add text shadow for better readability
      return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${overlay.size}" font-weight="${overlay.weight}" fill="black" fill-opacity="${overlay.opacity * 0.4}" dx="2" dy="2">${escaped}</text><text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${overlay.size}" font-weight="${overlay.weight}" fill="${overlay.color}" fill-opacity="${overlay.opacity}">${escaped}</text>`;
    })
    .join("");

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${textNodes}</svg>`,
  );
}

function buildWatermarkSvg(
  width: number,
  height: number,
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center",
  opacity: number,
  scale: number,
  textValue?: string,
) {
  const boxW = Math.round(width * clamp(scale, 0.1, 1) * 0.28);
  const boxH = Math.round(boxW * 0.28);
  const { x, y } = getWatermarkBounds(width, height, position, boxW, boxH);

  const actOpacity = clamp(opacity, 0, 1);
  const fontSize = Math.round(boxH * 0.42);
  const displayText = textValue || "ARVESTA";

  // Enhanced watermark with subtle shadow and better typography
  const content = `<defs>
      <filter id="wm-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect x="${x}" y="${y}" rx="8" ry="8" width="${boxW}" height="${boxH}" fill="#000000" fill-opacity="${actOpacity * 0.5}" filter="url(#wm-shadow)"/>
    <text x="${x + boxW / 2}" y="${y + boxH / 2 + fontSize * 0.35}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="2" fill="#FFFFFF" fill-opacity="${actOpacity}">${displayText}</text>`;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`,
  );
}

function getWatermarkBounds(
  width: number,
  height: number,
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center",
  boxW: number,
  boxH: number,
) {
  const margin = Math.round(Math.min(width, height) * 0.03);

  let x = margin;
  let y = margin;

  if (position === "top-right") {
    x = width - boxW - margin;
    y = margin;
  } else if (position === "bottom-left") {
    x = margin;
    y = height - boxH - margin;
  } else if (position === "bottom-right") {
    x = width - boxW - margin;
    y = height - boxH - margin;
  } else if (position === "center") {
    x = Math.round((width - boxW) / 2);
    y = Math.round((height - boxH) / 2);
  }

  return { x, y };
}

/**
 * Build a radial vignette overlay as an SVG with a radial gradient.
 * Strength 0-100 maps to edge darkness opacity.
 */
function buildVignetteSvg(width: number, height: number, strength: number) {
  const opacity = clamp(strength / 100, 0, 1);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="vig" cx="50%" cy="50%" r="70%">
          <stop offset="50%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="${opacity}"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#vig)"/>
    </svg>`,
  );
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = publishSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tempId, recipe } = parsed.data as {
    tempId: string;
    recipe: MediaEditRecipe;
  };

  const temp = await resolveTempFileById(tempId);
  if (!temp) {
    return NextResponse.json(
      { error: "Temp media not found" },
      { status: 404 },
    );
  }

  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;

  const inputBuffer = await readFile(temp.filePath);

  // Step 1: Auto-orient EXIF, then extract base dimensions
  let pipeline = sharp(inputBuffer, {
    limitInputPixels: 16_000_000,
  }).autoOrient();

  const baseMeta = await sharp(inputBuffer, { limitInputPixels: 16_000_000 })
    .autoOrient()
    .metadata();
  const baseW = baseMeta.width ?? 0;
  const baseH = baseMeta.height ?? 0;
  let outW = baseW;
  let outH = baseH;

  // Step 2: Crop (before rotation so coordinates match the preview)
  if (recipe.crop && baseW > 0 && baseH > 0) {
    let cl = Math.round((recipe.crop.x / 100) * baseW);
    let ct = Math.round((recipe.crop.y / 100) * baseH);
    let cw = Math.round((recipe.crop.width / 100) * baseW);
    let ch = Math.round((recipe.crop.height / 100) * baseH);

    cl = clamp(cl, 0, baseW - 1);
    ct = clamp(ct, 0, baseH - 1);
    cw = clamp(cw, 1, baseW - cl);
    ch = clamp(ch, 1, baseH - ct);

    if (!(cl === 0 && ct === 0 && cw === baseW && ch === baseH)) {
      pipeline = pipeline.extract({
        left: cl,
        top: ct,
        width: cw,
        height: ch,
      });
      outW = cw;
      outH = ch;
    }
  }

  // Step 3: Rotation (user-requested, separate from EXIF auto-orient)
  if (typeof recipe.rotate === "number" && recipe.rotate !== 0) {
    pipeline = pipeline.rotate(recipe.rotate);
    if (recipe.rotate === 90 || recipe.rotate === 270) {
      const t = outW;
      outW = outH;
      outH = t;
    }
  }

  // Step 4: Flip / Flop
  if (recipe.flip) {
    pipeline = pipeline.flip();
  }
  if (recipe.flop) {
    pipeline = pipeline.flop();
  }

  // Step 5: Color adjustments
  const brightness = (recipe.brightness ?? 0) / 100;
  const saturation = (recipe.saturation ?? 0) / 100;
  pipeline = pipeline.modulate({
    brightness: 1 + brightness,
    saturation: 1 + saturation,
  });

  const contrast = (recipe.contrast ?? 0) / 100;
  if (contrast !== 0) {
    pipeline = pipeline.linear(1 + contrast, -(128 * contrast));
  }

  // Step 6: Gamma correction
  if (recipe.gamma && recipe.gamma !== 1.0) {
    pipeline = pipeline.gamma(clamp(recipe.gamma, 0.5, 3.0));
  }

  // Step 7: Color temperature (warm/cool via recomb matrix)
  if (recipe.temperature && recipe.temperature !== 0) {
    const t = recipe.temperature / 100; // -1 to 1
    if (t > 0) {
      // Warm: boost red, slightly reduce blue
      pipeline = pipeline.recomb([
        [1 + t * 0.15, 0, 0],
        [0, 1 + t * 0.05, 0],
        [0, 0, 1 - t * 0.15],
      ]);
    } else {
      // Cool: boost blue, slightly reduce red
      const a = Math.abs(t);
      pipeline = pipeline.recomb([
        [1 - a * 0.15, 0, 0],
        [0, 1 + a * 0.05, 0],
        [0, 0, 1 + a * 0.15],
      ]);
    }
  }

  // Step 8: Auto-enhance
  if (recipe.autoEnhance) {
    pipeline = pipeline
      .modulate({ brightness: 1.04, saturation: 1.08 })
      .linear(1.03, -2)
      .sharpen({ sigma: 1.1, m1: 1, m2: 2 });
  }

  // Step 9: Sharpen
  if (recipe.sharpen && recipe.sharpen > 0) {
    const sigma = clamp(recipe.sharpen / 10, 0.5, 10);
    pipeline = pipeline.sharpen({
      sigma,
      m1: 1 + recipe.sharpen / 50,
      m2: 2 + recipe.sharpen / 25,
    });
  }

  // Step 10: Blur
  if (recipe.blur && recipe.blur > 0) {
    pipeline = pipeline.blur(clamp(recipe.blur, 0.3, 20));
  }

  // Step 11: Composites (vignette, text overlays, watermark)
  const composites: Array<{ input: Buffer; top?: number; left?: number }> = [];

  // Vignette overlay
  if (recipe.vignette && recipe.vignette > 0 && outW > 0 && outH > 0) {
    composites.push({
      input: buildVignetteSvg(outW, outH, recipe.vignette),
    });
  }

  // Text overlays
  if (recipe.textOverlays?.length && outW > 0 && outH > 0) {
    composites.push({
      input: textOverlayToSvg(outW, outH, recipe.textOverlays),
    });
  }

  // Watermark
  if (recipe.watermark?.enabled && outW > 0 && outH > 0) {
    const wmScale = clamp(recipe.watermark.scale, 0.1, 1);
    const wmOpacity = clamp(recipe.watermark.opacity, 0, 1);

    if (recipe.watermark.type === "logo") {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const logoW = Math.max(32, Math.round(outW * wmScale * 0.28));
      const logoH = logoW;
      const { x, y } = getWatermarkBounds(
        outW,
        outH,
        recipe.watermark.position,
        logoW,
        logoH,
      );

      try {
        const logoBuffer = await readFile(logoPath);
        // Preserve original alpha, then composite with desired opacity
        const preparedLogo = await sharp(logoBuffer)
          .resize({
            width: logoW,
            height: logoH,
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .ensureAlpha(wmOpacity)
          .png()
          .toBuffer();

        composites.push({ input: preparedLogo, left: x, top: y });
      } catch {
        // Fallback to text watermark if logo file not found
        composites.push({
          input: buildWatermarkSvg(
            outW,
            outH,
            recipe.watermark.position,
            recipe.watermark.opacity,
            recipe.watermark.scale,
            recipe.watermark.text,
          ),
        });
      }
    } else {
      composites.push({
        input: buildWatermarkSvg(
          outW,
          outH,
          recipe.watermark.position,
          recipe.watermark.opacity,
          recipe.watermark.scale,
          recipe.watermark.text,
        ),
      });
    }
  }

  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }

  // Step 12: Output format
  const quality = recipe.quality ?? 85;
  const format =
    recipe.format ??
    (temp.ext === ".png" ? "png" : temp.ext === ".webp" ? "webp" : "jpg");

  let finalExt: ".jpg" | ".png" | ".webp" = ".jpg";

  if (format === "png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
    finalExt = ".png";
  } else if (format === "webp") {
    pipeline = pipeline.webp({ quality });
    finalExt = ".webp";
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    finalExt = ".jpg";
  }

  try {
    const finalBuffer = await pipeline.toBuffer();

    const filename = `${Date.now()}-${randomUUID()}${finalExt}`;
    const uploadDir = getPublicUploadDir();
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, finalBuffer, { flag: "wx" });

    await unlink(temp.filePath).catch(() => undefined);

    // Depth map: copy from temp to permanent uploads
    let depthMapPublicUrl: string | undefined;
    if (recipe.depthParallax?.enabled && recipe.depthParallax.depthMapTempId) {
      const depthTemp = await resolveTempFileById(
        recipe.depthParallax.depthMapTempId,
      );
      if (depthTemp) {
        const depthFilename = `depth-${Date.now()}-${randomUUID()}.png`;
        const depthDestPath = path.join(uploadDir, depthFilename);
        await copyFile(depthTemp.filePath, depthDestPath);
        await unlink(depthTemp.filePath).catch(() => undefined);
        depthMapPublicUrl = `/uploads/products/${depthFilename}`;
      }
    }

    return NextResponse.json({
      url: `/uploads/products/${filename}`,
      filename,
      published: true,
      ...(depthMapPublicUrl && { depthMapUrl: depthMapPublicUrl }),
    });
  } catch (error: unknown) {
    const details =
      error instanceof Error ? error.message : "Unknown processing error";
    return NextResponse.json(
      { error: "Failed to process image", details },
      { status: 500 },
    );
  }
}
