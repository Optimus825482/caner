import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildClientKey,
  createSiteSettingRateLimitAdapter,
  enforceRateLimit,
  enforceSameOrigin,
  getClientIp,
} from "@/lib/request-guards";
import { sendContactSubmissionNotification } from "@/lib/mailer";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

// DÜZELTME: Memory yerine kalıcı DB (Site Settings) bazlı rate limit.
const contactRateLimitAdapter = createSiteSettingRateLimitAdapter(
  prisma.siteSetting,
);

const contactSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(30),
  projectType: z.string().trim().min(1).max(120),
  description: z.string().trim().min(10).max(5000),
  locale: z.string().trim().min(1).max(10).default("fr"),
  honeypot: z.string().trim().max(0).optional().default(""),
  captchaToken: z.string().trim().min(1).optional(),
});

async function verifyTurnstileToken(
  token: string,
  ip: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) return false;

  const data = (await response.json()) as { success?: boolean };
  return !!data.success;
}

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const clientIp = getClientIp(req);
  const clientKey = buildClientKey(req, "contact");
  const rateLimited = await enforceRateLimit({
    adapter: contactRateLimitAdapter,
    keyPrefix: "contact_rl",
    clientKey,
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    errorMessage: "Too many contact requests. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      fullName,
      email,
      phone,
      projectType,
      description,
      locale,
      honeypot,
      captchaToken,
    } = parsed.data;

    if (honeypot) {
      return NextResponse.json({ error: "Spam detected" }, { status: 400 });
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!captchaToken) {
        return NextResponse.json(
          { error: "Captcha token is required" },
          { status: 400 },
        );
      }

      const captchaOk = await verifyTurnstileToken(captchaToken, clientIp);
      if (!captchaOk) {
        return NextResponse.json(
          { error: "Captcha verification failed" },
          { status: 400 },
        );
      }
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        fullName,
        email,
        phone,
        projectType,
        description,
        locale,
      },
    });

    try {
      await sendContactSubmissionNotification(submission);
    } catch {
      // Do not fail user request if email forwarding fails.
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
