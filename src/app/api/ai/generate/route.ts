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

const generateSchema = z.object({
  type: z.enum(["blog_content", "blog_excerpt", "faq_answer"]),
  prompt: z.string().trim().min(1),
  locale: z.string().trim().min(2),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  blog_content: `You are a content writer for Arvesta, a luxury custom furniture company based in Aksaray, Turkey, serving European markets. Write engaging, SEO-friendly blog articles about custom furniture, interior design, materials, and craftsmanship. Use a premium but approachable tone. Output ONLY the article content in the requested language, no titles or metadata.`,
  blog_excerpt: `You are a content writer for Arvesta, a luxury custom furniture company. Write a compelling 1-2 sentence excerpt/summary for a blog post. Output ONLY the excerpt text in the requested language.`,
  faq_answer: `You are a customer service expert for Arvesta, a luxury custom furniture company based in Aksaray, Turkey, delivering to Europe. Write clear, helpful FAQ answers that build trust. Keep answers concise but informative (2-4 sentences). Output ONLY the answer text in the requested language.`,
};

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const body = await req.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { type, prompt, locale } = parsed.data;
  const langName = LOCALE_NAMES[locale] || locale;

  const result = await callNvidiaAi(
    [
      { role: "system", content: SYSTEM_PROMPTS[type] },
      {
        role: "user",
        content: `Write in ${langName}. ${prompt}`,
      },
    ],
    { maxTokens: type === "blog_content" ? 8192 : 2048 },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ generated: result.text });
}
