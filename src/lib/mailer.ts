import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type ContactSubmissionMailPayload = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  projectType: string;
  description: string;
  locale: string;
  createdAt: Date;
};

export const MAIL_KEYS = [
  "smtp_enabled",
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "smtp_to",
] as const;

type SmtpConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
};

let cachedTransporter: {
  smtp: SmtpConfig;
  transporter: nodemailer.Transporter;
} | null = null;

export function invalidateSmtpCache() {
  cachedTransporter = null;
}

function toBool(value?: string) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...MAIL_KEYS] } },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const port = Number(map.smtp_port);

  return {
    enabled: toBool(map.smtp_enabled),
    host: map.smtp_host?.trim() ?? "",
    port: Number.isFinite(port) ? port : 0,
    secure: toBool(map.smtp_secure) || port === 465,
    user: map.smtp_user?.trim() ?? "",
    pass: map.smtp_pass ?? "",
    from: map.smtp_from?.trim() || map.smtp_user?.trim() || "",
    to: map.smtp_to?.trim() ?? "",
  };
}

function hasValidSmtpConfig(config: SmtpConfig): boolean {
  return !!(
    config.enabled &&
    config.host &&
    config.port > 0 &&
    config.user &&
    config.pass &&
    config.from &&
    config.to
  );
}

async function createTransporterFromSettings(options?: {
  bypassCache?: boolean;
}) {
  const bypassCache = options?.bypassCache === true;

  if (!bypassCache && cachedTransporter) {
    return cachedTransporter;
  }

  const smtp = await getSmtpConfig();
  if (!hasValidSmtpConfig(smtp)) return null;

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  const transport = { smtp, transporter };

  if (!bypassCache) {
    cachedTransporter = transport;
  }

  return transport;
}

export async function testSmtpConnection() {
  const transport = await createTransporterFromSettings({ bypassCache: true });
  if (!transport) {
    return { ok: false as const, error: "SMTP config is missing or disabled." };
  }

  try {
    await transport.transporter.verify();
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SMTP verify]", message);
    return {
      ok: false as const,
      error: `SMTP verification failed: ${message}`,
    };
  }
}

export async function sendSmtpTestMail() {
  const transport = await createTransporterFromSettings({ bypassCache: true });
  if (!transport) {
    return { ok: false as const, error: "SMTP config is missing or disabled." };
  }

  try {
    await transport.transporter.sendMail({
      from: transport.smtp.from,
      to: transport.smtp.to,
      subject: "Arvesta SMTP Test",
      text: "SMTP ayarları başarıyla çalışıyor. Bu bir test mesajıdır.",
    });
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SMTP sendTest]", message);
    return {
      ok: false as const,
      error: `Failed to send test email: ${message}`,
    };
  }
}

export async function sendContactSubmissionNotification(
  submission: ContactSubmissionMailPayload,
) {
  const transport = await createTransporterFromSettings();

  if (!transport) {
    return { sent: false as const, reason: "smtp_missing_config" as const };
  }

  await transport.transporter.sendMail({
    from: transport.smtp.from,
    to: transport.smtp.to,
    replyTo: submission.email,
    subject: `New Contact Submission - ${submission.fullName}`,
    text: [
      `Name: ${submission.fullName}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone ?? "-"}`,
      `Project Type: ${submission.projectType}`,
      `Locale: ${submission.locale}`,
      `Created At: ${submission.createdAt.toISOString()}`,
      "",
      "Message:",
      submission.description,
      "",
      `Submission ID: ${submission.id}`,
    ].join("\n"),
  });

  return { sent: true as const };
}
