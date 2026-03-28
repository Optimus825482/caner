"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

const COOKIE_KEY = "arvesta-cookie-consent";

export type ConsentValue = "accepted" | "declined" | "custom" | null;

/** Read current consent from localStorage */
export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_KEY) as ConsentValue;
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const t = useTranslations("cookie");

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = useCallback((value: ConsentValue) => {
    localStorage.setItem(COOKIE_KEY, value!);
    // Dispatch event so Analytics component can react
    window.dispatchEvent(new Event("consent-update"));
    setShow(false);
    setShowCustom(false);
  }, []);

  function accept() {
    localStorage.setItem("arvesta-analytics", "true");
    save("accepted");
  }

  function decline() {
    localStorage.setItem("arvesta-analytics", "false");
    save("declined");
  }

  function saveCustom() {
    localStorage.setItem("arvesta-analytics", String(analytics));
    save("custom");
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-950 border-t border-(--arvesta-gold)/25 bg-(--arvesta-bg)/95 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
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
              onClick={() => setShowCustom(!showCustom)}
              className="rounded-full border border-white/20 px-5 py-2 font-ui text-xs font-semibold text-(--arvesta-text-muted) transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-gold)"
            >
              {t("customize")}
            </button>
            <button
              onClick={accept}
              className="rounded-full border border-(--arvesta-gold)/50 bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) px-6 py-2 font-ui text-xs font-bold text-[#2b160a] shadow-[0_8px_20px_rgba(212,175,106,0.25)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-gold)"
            >
              {t("accept")}
            </button>
          </div>
        </div>

        {showCustom && (
          <div className="mt-4 rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.02)] p-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 accent-(--arvesta-gold)"
                />
                <span className="text-sm text-(--arvesta-text-secondary)">
                  {t("essential")}
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="h-4 w-4 accent-(--arvesta-gold)"
                />
                <span className="text-sm text-(--arvesta-text-secondary)">
                  {t("analytics")}
                </span>
              </label>
            </div>
            <button
              onClick={saveCustom}
              className="mt-4 rounded-full border border-(--arvesta-gold)/50 bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) px-6 py-2 font-ui text-xs font-bold text-[#2b160a] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-gold)"
            >
              {t("savePreferences")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
