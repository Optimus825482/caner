import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import { enforceSameOrigin } from "@/lib/request-guards";
import { callNvidiaAi } from "@/lib/nvidia-ai";

const LOCALE_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
  tr: "Turkish",
};

const translateSchema = z.object({
  text: z.string().trim().min(1),
  fromLocale: z.string().trim().min(2),
  toLocale: z.string().trim().min(2),
});

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const body = await req.json();
  const parsed = translateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { text, fromLocale, toLocale } = parsed.data;
  const fromName = LOCALE_NAMES[fromLocale] || fromLocale;
  const toName = LOCALE_NAMES[toLocale] || toLocale;

  const result = await callNvidiaAi([
    {
      role: "system",
      content: `You are a professional translator for a luxury custom furniture company called Arvesta. Translate accurately while maintaining the brand's premium, elegant tone. Output ONLY the translated text, nothing else.`,
    },
    {
      role: "user",
      content: `Translate the following text from ${fromName} to ${toName}:\n\n${text}`,
    },
  ]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ translated: result.text });
}
