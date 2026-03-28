"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Preloader({ logoUrl }: { logoUrl?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    // Only show on first visit per session
    if (sessionStorage.getItem("arvesta-preloader-shown")) {
      // Use a microtask to avoid synchronous state update in effect
      Promise.resolve().then(() => setSkip(true));
      return;
    }
    sessionStorage.setItem("arvesta-preloader-shown", "1");

    // 3 second preloader
    const timer = setTimeout(() => setLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded) {
      const t = setTimeout(() => setHidden(true), 700);
      return () => clearTimeout(t);
    }
  }, [loaded]);

  if (skip || hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-99999 flex flex-col items-center justify-center bg-(--arvesta-bg) transition-opacity duration-700 ${
        loaded ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-preloader-pulse mb-10">
        <Image
          src={logoUrl || "/uploads/products/logo.png"}
          alt="Arvesta"
          width={180}
          height={180}
          className="object-contain drop-shadow-[0_8px_32px_rgba(200,168,110,0.4)]"
          priority
        />
      </div>
      <div className="h-px w-40 overflow-hidden rounded-full bg-white/10">
        <div className="animate-preloader-fill h-full bg-linear-to-r from-(--arvesta-accent) to-(--arvesta-gold)" />
      </div>
      <p className="mt-5 font-brand text-base tracking-wider text-(--arvesta-text-muted)">
        Arvesta Menuiserie France
      </p>
    </div>
  );
}
