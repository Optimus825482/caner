"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useScrollReveal } from "@/hooks/useScrollReveal";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function getFriendlyErrorMessage(
  t: ReturnType<typeof useTranslations<"contact">>,
  status: number,
  apiError?: string,
): string {
  if (status === 429) {
    return t("errors.rateLimited");
  }

  if (status === 403) {
    return t("errors.securityFailed");
  }

  if (status === 400) {
    if (apiError?.toLowerCase().includes("captcha")) {
      return t("errors.captchaRequired");
    }

    if (apiError?.toLowerCase().includes("spam")) {
      return t("errors.spamDetected");
    }

    return t("errors.invalidForm");
  }

  return t("errors.generic");
}

interface ContactSettings {
  address?: string;
  phone?: string;
  email?: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function ContactForm({
  locale,
  settings,
  categories = [],
}: {
  locale: string;
  settings?: ContactSettings;
  categories?: CategoryOption[];
}) {
  const t = useTranslations("contact");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isTurnstileScriptLoaded, setIsTurnstileScriptLoaded] = useState(false);

  const { ref: leftRef, isVisible: leftVisible } = useScrollReveal();
  const { ref: rightRef, isVisible: rightVisible } = useScrollReveal();

  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey) return;

    if (window.turnstile) {
      setIsTurnstileScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (!isTurnstileScriptLoaded) return;
    if (!window.turnstile) return;
    if (!turnstileContainerRef.current) return;
    if (turnstileWidgetIdRef.current) return;

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setCaptchaToken(token);
        },
        "expired-callback": () => {
          setCaptchaToken("");
        },
        "error-callback": () => {
          setCaptchaToken("");
        },
      },
    );

    // DÜZELTME: Component unmount olduğunda widget DOM'dan temizlenir.
    return () => {
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [isTurnstileScriptLoaded]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErrorMessage("");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: String(data.get("fullName") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          projectType: String(data.get("projectType") ?? ""),
          description: String(data.get("description") ?? ""),
          honeypot: String(data.get("honeypot") ?? ""),
          captchaToken: captchaToken || undefined,
          locale,
        }),
      });

      if (res.ok) {
        setSent(true);
        form.reset();
        setCaptchaToken("");
        if (window.turnstile && turnstileWidgetIdRef.current) {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        }
        setTimeout(() => setSent(false), 3000);
        return;
      }

      let apiError = "";
      try {
        const payload = (await res.json()) as { error?: string };
        apiError = payload.error ?? "";
      } catch {
        // ignore parse errors
      }

      setErrorMessage(getFriendlyErrorMessage(t, res.status, apiError));
    } catch {
      setErrorMessage(t("errors.network"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(196,161,90,0.2),transparent_40%),linear-gradient(180deg,#050d1d_0%,#040916_100%)] px-6 py-24"
      id="contact"
    >
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setIsTurnstileScriptLoaded(true)}
        />
      ) : null}
      <div className="mx-auto grid max-w-300 grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-14">
        <div
          ref={leftRef}
          className={`relative rounded-3xl border border-[rgba(196,161,90,0.32)] bg-[linear-gradient(165deg,rgba(12,24,44,0.72),rgba(6,14,28,0.82))] p-8 shadow-[0_24px_80px_rgba(2,8,20,0.5)] backdrop-blur-[10px] ${leftVisible ? "anim-reveal-left" : "opacity-0"}`}
        >
          <span className="mb-3 block font-ui text-xs font-bold tracking-[0.28em] text-(--arvesta-accent) uppercase">
            {t("tag")}
          </span>
          <h2 className="mb-4 font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight text-white">
            {t("title")}
          </h2>
          <p className="mb-8 max-w-[46ch] text-base leading-relaxed text-(--arvesta-text-secondary)">
            {t("desc")}
          </p>

          <div className="flex flex-col gap-5">
            <div className="group flex items-start gap-4 rounded-2xl border border-[rgba(196,161,90,0.18)] bg-[rgba(4,12,24,0.56)] p-4 transition-colors hover:border-[rgba(196,161,90,0.38)]">
              <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-xl border border-[rgba(196,161,90,0.35)] bg-[rgba(196,161,90,0.12)] text-(--arvesta-accent)">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <strong className="mb-0.5 block font-ui text-sm font-semibold text-white">
                  {t("office")}
                </strong>
                <span className="text-sm text-(--arvesta-text-secondary)">
                  {settings?.address || "75001 Paris, France"}
                </span>
              </div>
            </div>
            <div className="group flex items-start gap-4 rounded-2xl border border-[rgba(196,161,90,0.18)] bg-[rgba(4,12,24,0.56)] p-4 transition-colors hover:border-[rgba(196,161,90,0.38)]">
              <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-xl border border-[rgba(196,161,90,0.35)] bg-[rgba(196,161,90,0.12)] text-(--arvesta-accent)">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <strong className="mb-0.5 block font-ui text-sm font-semibold text-white">
                  {t("call")}
                </strong>
                <span className="text-sm text-(--arvesta-text-secondary)">
                  {settings?.phone || "+33 (0) 1 43 67 88"}
                </span>
              </div>
            </div>
            <div className="group flex items-start gap-4 rounded-2xl border border-[rgba(196,161,90,0.18)] bg-[rgba(4,12,24,0.56)] p-4 transition-colors hover:border-[rgba(196,161,90,0.38)]">
              <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-xl border border-[rgba(196,161,90,0.35)] bg-[rgba(196,161,90,0.12)] text-(--arvesta-accent)">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <strong className="mb-0.5 block font-ui text-sm font-semibold text-white">
                  Email
                </strong>
                <span className="text-sm text-(--arvesta-text-secondary)">
                  {settings?.email || "contact@arvesta-france.com"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={rightRef}
          className={`rounded-3xl border border-[rgba(196,161,90,0.34)] bg-[linear-gradient(180deg,rgba(7,17,34,0.9),rgba(5,12,24,0.84))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-[14px] ${rightVisible ? "anim-reveal-right" : "opacity-0"}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                name="fullName"
                placeholder={t("name")}
                aria-label={t("name")}
                autoComplete="name"
                required
                className="h-12 rounded-xl border-[rgba(196,161,90,0.32)] bg-[linear-gradient(180deg,rgba(3,11,22,0.9),rgba(3,10,20,0.82))] text-white placeholder:text-(--arvesta-text-muted) focus-visible:border-(--arvesta-accent) focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow)"
              />
              <Input
                name="email"
                type="email"
                placeholder={t("email")}
                aria-label={t("email")}
                autoComplete="email"
                required
                className="h-12 rounded-xl border-[rgba(196,161,90,0.32)] bg-[linear-gradient(180deg,rgba(3,11,22,0.9),rgba(3,10,20,0.82))] text-white placeholder:text-(--arvesta-text-muted) focus-visible:border-(--arvesta-accent) focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow)"
              />
            </div>

            <Input
              name="phone"
              type="tel"
              placeholder={t("phone")}
              aria-label={t("phone")}
              autoComplete="tel"
              required
              className="h-12 rounded-xl border-[rgba(196,161,90,0.32)] bg-[linear-gradient(180deg,rgba(3,11,22,0.9),rgba(3,10,20,0.82))] text-white placeholder:text-(--arvesta-text-muted) focus-visible:border-(--arvesta-accent) focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow)"
            />

            <Input
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <select
              name="projectType"
              aria-label={t("select")}
              required
              className="h-12 w-full appearance-none rounded-xl border border-[rgba(196,161,90,0.32)] bg-[linear-gradient(180deg,rgba(3,11,22,0.9),rgba(3,10,20,0.82))] px-4 text-sm text-(--arvesta-text-secondary) focus-visible:border-(--arvesta-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow)"
            >
              <option value="" disabled className="bg-[#0a1628] text-white">
                {t("select")}
              </option>
              {categories.map((cat) => (
                <option
                  key={cat.value}
                  value={cat.value}
                  className="bg-[#0a1628] text-white"
                >
                  {cat.label}
                </option>
              ))}
              <option value="commercial" className="bg-[#0a1628] text-white">
                {t("optCommercial")}
              </option>
              <option value="custom" className="bg-[#0a1628] text-white">
                {t("optCustom")}
              </option>
            </select>
            <Textarea
              name="description"
              placeholder={t("desc_field")}
              aria-label={t("desc_field")}
              autoComplete="off"
              rows={4}
              required
              className="resize-none rounded-xl border-[rgba(196,161,90,0.32)] bg-[linear-gradient(180deg,rgba(3,11,22,0.9),rgba(3,10,20,0.82))] text-white placeholder:text-(--arvesta-text-muted) focus-visible:border-(--arvesta-accent) focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow)"
            />

            {turnstileSiteKey ? (
              <div className="rounded-xl border border-[rgba(196,161,90,0.34)] bg-[linear-gradient(160deg,rgba(2,10,20,0.74),rgba(4,12,23,0.9))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div ref={turnstileContainerRef} />
              </div>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={sending}
              className={`h-12 w-full rounded-xl font-ui text-sm font-bold tracking-[0.08em] text-white transition-all focus-visible:ring-offset-[rgba(6,14,26,0.95)] ${
                sent
                  ? "bg-green-600 hover:bg-green-600"
                  : "border border-[rgba(196,161,90,0.45)] bg-[linear-gradient(90deg,#b89658,#d6b97a)] shadow-[0_14px_35px_rgba(196,161,90,0.32)] hover:-translate-y-px hover:brightness-105"
              }`}
            >
              {sent ? "✓ " + t("success") : sending ? "..." : t("submit")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
