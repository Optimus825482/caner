import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  buildClientKey,
  createSiteSettingRateLimitAdapter,
  enforceRateLimit,
  enforceSameOrigin,
} from "@/lib/request-guards";
import { prisma } from "@/lib/prisma";
import { sendSmtpTestMail, testSmtpConnection } from "@/lib/mailer";

const adapter = createSiteSettingRateLimitAdapter(prisma.siteSetting);

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  const authResult = await requireAdminAuth();
  if (!authResult.ok) return authResult.response;

  const clientKey = buildClientKey(req, "settings:test-smtp");
  const rateLimited = await enforceRateLimit({
    adapter,
    keyPrefix: "settings_test_smtp_rl",
    clientKey,
    windowMs: 60_000,
    maxRequests: 5,
    errorMessage: "Too many SMTP test attempts. Please try again later.",
  });
  if (rateLimited) return rateLimited;

  const verify = await testSmtpConnection();
  if (!verify.ok) {
    return NextResponse.json({ ok: false, error: verify.error }, { status: 400 });
  }

  const sent = await sendSmtpTestMail();
  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: sent.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "SMTP test mail sent successfully." });
}
