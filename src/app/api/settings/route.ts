import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import {
  buildClientKey,
  createSiteSettingRateLimitAdapter,
  enforceRateLimit,
  enforceSameOrigin,
} from "@/lib/request-guards";

const settingsSchema = z.record(
  z.string().trim().min(1),
  z.union([z.string(), z.number(), z.boolean()]),
);

const settingsRateLimitAdapter = createSiteSettingRateLimitAdapter(prisma.siteSetting);
const SETTINGS_MUTATION_RATE_LIMIT_WINDOW_MS = 60_000;
const SETTINGS_MUTATION_RATE_LIMIT_MAX_REQUESTS = 20;

function prismaWriteErrorResponse(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;

  if (code === "P2002") {
    return NextResponse.json(
      { error: "Resource already exists", code },
      { status: 409 },
    );
  }

  if (code === "P2025") {
    return NextResponse.json(
      { error: "Resource not found", code },
      { status: 404 },
    );
  }

  if (code === "P2003" || code === "P2014") {
    return NextResponse.json(
      { error: "Invalid relation reference", code },
      { status: 422 },
    );
  }

  return NextResponse.json({ error: "Database write failed" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, string> = {};

  for (const setting of settings) {
    map[setting.key] = setting.value;
  }

  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const clientKey = buildClientKey(req, "settings:update");
  const rateLimited = await enforceRateLimit({
    adapter: settingsRateLimitAdapter,
    keyPrefix: "settings_mutation_rl",
    clientKey,
    windowMs: SETTINGS_MUTATION_RATE_LIMIT_WINDOW_MS,
    maxRequests: SETTINGS_MUTATION_RATE_LIMIT_MAX_REQUESTS,
    errorMessage: "Too many settings update requests. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const entries = Object.entries(parsed.data).map(([key, value]) => [
    key.trim(),
    String(value).trim(),
  ]) as [string, string][];

  try {
    for (const [key, value] of entries) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return prismaWriteErrorResponse(error);
  }
}
