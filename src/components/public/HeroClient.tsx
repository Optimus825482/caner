"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronsDown } from "lucide-react";

interface Slide {
  id: string;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
}

export default function HeroClient({
  slides,
}: {
  slides: Slide[];
  locale: string;
}) {
  const t = useTranslations("hero");
  const [current, setCurrent] = useState(0);

  const safeSlides = useMemo(() => {
    if (slides.length > 0) return slides;

    return [
      {
        id: "fallback-hero",
        image: "/uploads/hero/hero.jpg",
        badge: "",
        title: "",
        subtitle: "",
      },
    ];
  }, [slides]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % safeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [safeSlides.length]);

  return (
    <section
      className="relative flex h-screen min-h-[700px] w-full items-center justify-center overflow-hidden"
      id="hero"
    >
      <div className="absolute inset-0">
        {safeSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ${
              i === current ? "opacity-100 animate-hero-zoom" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-black/45 to-black/85" />
      <div className="animate-hero-shimmer pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-[#f3c98b]/10 to-transparent mix-blend-soft-light" />

      <div className="animate-cinematic-in relative z-[2] mx-auto max-w-5xl px-4 text-center sm:px-6">
        <span
          className="mb-6 inline-block rounded-full border border-[#f3c98b]/35 bg-black/30 px-5 py-2 font-ui text-[0.68rem] font-bold uppercase tracking-[0.34em] text-[#f3c98b] backdrop-blur-md animate-fade-up"
          style={{ animationDelay: "0.5s", animationFillMode: "both" }}
        >
          {safeSlides[current]?.badge}
        </span>

        <h1 className="mb-8 text-shadow-hero">
          <span
            className="animate-fade-up font-display text-[clamp(3.1rem,8.8vw,6.2rem)] font-bold leading-[1.05] tracking-[0.01em] text-white"
            style={{ animationDelay: "0.7s", animationFillMode: "both" }}
          >
            {safeSlides[current]?.title}
          </span>
        </h1>

        <p
          className="mx-auto mb-12 max-w-2xl animate-fade-up text-[clamp(1.05rem,2.1vw,1.25rem)] font-light leading-relaxed text-white/78"
          style={{ animationDelay: "1.1s", animationFillMode: "both" }}
        >
          {safeSlides[current]?.subtitle}
        </p>

        <div
          className="flex animate-fade-up flex-col justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "1.3s", animationFillMode: "both" }}
        >
          <a
            href="#collections"
            className="animate-pulse-glow rounded-full border border-[#ffd8a6]/40 bg-gradient-to-b from-[#f6c583] to-[var(--arvesta-accent)] px-9 py-4 font-ui text-lg font-bold text-[#2b160a] shadow-[0_14px_34px_rgba(232,98,44,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {t("cta1")}
          </a>
          <a
            href="#savoir-faire"
            className="rounded-full border border-white/25 bg-white/[0.08] px-9 py-4 font-ui text-lg font-bold text-white backdrop-blur-[14px] transition-all duration-300 hover:border-[#f3c98b]/50 hover:bg-white/[0.14] hover:text-[#f8ddba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {t("cta2")}
          </a>
        </div>
      </div>

      <div className="animate-float-slow absolute bottom-8 left-1/2 z-[2] -translate-x-1/2 rounded-full border border-white/20 bg-black/25 p-2 text-white/85 backdrop-blur-sm">
        <ChevronsDown className="h-7 w-7" strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-10 right-10 z-[2] hidden items-center gap-1 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 font-ui text-[0.8rem] text-[var(--arvesta-text-muted)] backdrop-blur-sm md:flex">
        <span className="font-semibold text-[#f3c98b]">
          {String(current + 1).padStart(2, "0")}
        </span>
        <span>/</span>
        <span>{String(safeSlides.length).padStart(2, "0")}</span>
      </div>
    </section>
  );
}
