"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed bottom-6 right-24 z-[900] flex h-11 w-11 items-center justify-center rounded-full border border-[var(--arvesta-gold)]/40 bg-[var(--arvesta-bg)]/80 text-[var(--arvesta-gold)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-500 hover:border-[var(--arvesta-gold)] hover:bg-[var(--arvesta-accent)]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--arvesta-bg)] ${
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <ChevronUp className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}
