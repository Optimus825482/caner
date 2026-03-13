"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const COOKIE_KEY = "arvesta-cookie-consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const t = useTranslations("cookie");

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setShow(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-950 border-t border-(--arvesta-gold)/25 bg-(--arvesta-bg)/95 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm leading-relaxed text-(--arvesta-text-secondary) sm:text-left">
          {t("message")}
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={decline}
            className="rounded-full border border-white/20 px-5 py-2 font-ui text-xs font-semibold text-(--arvesta-text-muted) transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-gold)"
          >
            {t("decline")}
          </button>
          <button
            onClick={accept}
            className="rounded-full border border-(--arvesta-gold)/50 bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) px-6 py-2 font-ui text-xs font-bold text-[#2b160a] shadow-[0_8px_20px_rgba(212,175,106,0.25)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-gold)"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
