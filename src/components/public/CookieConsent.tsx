"use client";

import { useState, useEffect } from "react";

const COOKIE_KEY = "arvesta-cookie-consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
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
    <div className="fixed bottom-0 left-0 right-0 z-[950] border-t border-[var(--arvesta-gold)]/25 bg-[var(--arvesta-bg)]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm leading-relaxed text-[var(--arvesta-text-secondary)] sm:text-left">
          Ce site utilise des cookies pour améliorer votre expérience. En
          continuant, vous acceptez notre politique de confidentialité.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={decline}
            className="rounded-full border border-white/20 px-5 py-2 font-ui text-xs font-semibold text-[var(--arvesta-text-muted)] transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="rounded-full border border-[var(--arvesta-gold)]/50 bg-gradient-to-b from-[#f6c583] to-[var(--arvesta-accent)] px-6 py-2 font-ui text-xs font-bold text-[#2b160a] shadow-[0_8px_20px_rgba(212,175,106,0.25)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
