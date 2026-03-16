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
      content: `You are a professional translator for a luxury custom furniture company called Arvesta. Your translations must be indistinguishable from text originally written by a native speaker.

CRITICAL RULES:
1. PRESERVE STRUCTURE EXACTLY: Keep all paragraph breaks, line breaks, headings, bullet points, numbered lists, and any formatting from the source text. If the source has 5 paragraphs, the translation must have 5 paragraphs. Never merge paragraphs or flatten structure.
2. PRESERVE MARKDOWN: If the source contains markdown (##, **, *, -, 1., etc.), keep the exact same markdown syntax in the translation.
3. NATURAL FLUENCY: Write as a native speaker would — use natural idioms, sentence flow, and rhythm of the target language. Avoid word-for-word translation. Restructure sentences when needed for natural flow.
4. TONE CONSISTENCY: Maintain Arvesta's premium, elegant but approachable tone. Adapt cultural nuances appropriately.
5. TECHNICAL ACCURACY: Furniture/design terminology must be correct in the target language.
6. Output ONLY the translated text — no explanations, no notes, no "Here is the translation" prefix.`,
    },
    {
      role: "user",
      content: `Translate from ${fromName} to ${toName}.

IMPORTANT: The source text below contains specific formatting (paragraph breaks, markdown headings like ##, bold markers **, lists with - or 1., etc.). You MUST reproduce the EXACT SAME structure in your translation. Count the paragraphs — your output must have the same number. Count the headings — your output must have the same headings. Do NOT merge anything into a single block of text.

SOURCE TEXT:

${text}`,
    },
  ]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ translated: result.text });
}
