"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import ImageShimmer from "@/components/public/ImageShimmer";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useScrollReveal";
import { TreePine, Ruler, Truck } from "lucide-react";

export default function AboutClient({ locale }: { locale: string }) {
  const t = useTranslations("about");

  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const { ref: storyRef, isVisible: storyVisible } = useScrollReveal();
  const {
    ref: numRef,
    isVisible: numVisible,
    getDelay,
  } = useStaggerReveal(4, 140, 400);
  const {
    ref: craftRef,
    isVisible: craftVisible,
    getDelay: craftDelay,
  } = useStaggerReveal(3, 160, 500);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();

  const numbers = [
    { value: t("num1"), label: t("num1Label") },
    { value: t("num2"), label: t("num2Label") },
    { value: t("num3"), label: t("num3Label") },
    { value: t("num4"), label: t("num4Label") },
  ];

  const crafts = [
    { icon: TreePine, title: t("craft1Title"), desc: t("craft1Desc") },
    { icon: Ruler, title: t("craft2Title"), desc: t("craft2Desc") },
    { icon: Truck, title: t("craft3Title"), desc: t("craft3Desc") },
  ];

  return (
    <div className="relative overflow-x-clip">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(200,168,110,0.18),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(10,20,44,0.7),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/uploads/products/kitchen-1.jpg')] bg-cover bg-center opacity-[0.07]" />

        <div
          ref={heroRef}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <span
            className={`mb-4 inline-block font-ui text-xs font-bold uppercase tracking-[0.28em] text-[var(--arvesta-gold)]/90 ${heroVisible ? "anim-title-reveal" : "opacity-0"}`}
          >
            {t("heroTag")}
          </span>
          <h1
            className={`mb-6 font-display text-5xl font-bold leading-[1.1] text-white md:text-7xl ${heroVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.12s" }}
          >
            {t("heroTitle")}
          </h1>
          <p
            className={`mx-auto max-w-xl text-base leading-relaxed text-[var(--arvesta-text-secondary)] md:text-lg ${heroVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.24s" }}
          >
            {t("heroDesc")}
          </p>
          <div
            className={`mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-[var(--arvesta-gold)]/70 to-transparent ${heroVisible ? "anim-line-expand" : "opacity-0 scale-x-0"}`}
            style={{ animationDelay: "0.36s" }}
          />
        </div>
      </section>

      {/* ── Story ── */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div
            ref={storyRef}
            className="grid items-center gap-12 md:grid-cols-2 md:gap-16"
          >
            <div
              className={`relative aspect-[4/5] overflow-hidden rounded-3xl border border-[var(--arvesta-gold)]/20 shadow-[0_24px_60px_rgba(2,8,20,0.5)] ${storyVisible ? "anim-slide-left" : "opacity-0"}`}
            >
              <ImageShimmer
                src="/uploads/products/wardrobe-1.jpg"
                alt="Arvesta workshop"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020611]/60 via-transparent to-transparent" />
            </div>

            <div
              className={storyVisible ? "anim-slide-right" : "opacity-0"}
              style={{ animationDelay: "0.15s" }}
            >
              <span className="mb-3 block font-ui text-xs font-bold uppercase tracking-[0.24em] text-[var(--arvesta-gold)]/90">
                {t("storyTag")}
              </span>
              <h2 className="mb-6 font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                {t("storyTitle")}
              </h2>
              <p className="mb-5 text-[0.95rem] leading-relaxed text-[var(--arvesta-text-secondary)]">
                {t("storyP1")}
              </p>
              <p className="text-[0.95rem] leading-relaxed text-[var(--arvesta-text-secondary)]">
                {t("storyP2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers ── */}
      <section className="relative overflow-hidden px-4 py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,168,110,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span
            className={`mb-10 block font-ui text-xs font-bold uppercase tracking-[0.24em] text-[var(--arvesta-gold)]/90 ${numVisible ? "anim-title-reveal" : "opacity-0"}`}
          >
            {t("numbersTag")}
          </span>
          <div
            ref={numRef}
            className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6"
          >
            {numbers.map((n, i) => (
              <div
                key={i}
                className={`group rounded-2xl border border-[var(--arvesta-gold)]/15 bg-[rgba(10,21,42,0.5)] p-6 transition-all duration-500 hover:border-[var(--arvesta-gold)]/40 hover:bg-[rgba(10,21,42,0.7)] md:p-8 ${numVisible ? "anim-reveal-up" : "opacity-0"}`}
                style={{ animationDelay: `${getDelay(i)}ms` }}
              >
                <div className="mb-2 font-display text-4xl font-bold text-[var(--arvesta-gold)] md:text-5xl">
                  {n.value}
                </div>
                <div className="font-ui text-xs font-medium uppercase tracking-[0.12em] text-[var(--arvesta-text-secondary)]">
                  {n.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Craft / Approach ── */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center md:mb-16">
            <span
              className={`mb-3 block font-ui text-xs font-bold uppercase tracking-[0.24em] text-[var(--arvesta-gold)]/90 ${craftVisible ? "anim-title-reveal" : "opacity-0"}`}
            >
              {t("craftTag")}
            </span>
            <h2
              className={`font-display text-3xl font-bold text-white md:text-4xl ${craftVisible ? "anim-reveal-up" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              {t("craftTitle")}
            </h2>
          </div>

          <div ref={craftRef} className="grid gap-6 md:grid-cols-3 md:gap-8">
            {crafts.map((c, i) => (
              <article
                key={i}
                className={`tilt-card group relative overflow-hidden rounded-3xl border border-[var(--arvesta-gold)]/20 bg-[linear-gradient(160deg,rgba(10,21,42,0.9),rgba(5,11,24,0.95))] p-8 shadow-[0_20px_50px_rgba(2,8,20,0.45)] transition-all duration-500 hover:border-[var(--arvesta-gold)]/45 md:p-10 ${craftVisible ? "anim-reveal-up" : "opacity-0"}`}
                style={{ animationDelay: `${craftDelay(i)}ms` }}
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="h-full w-full bg-[radial-gradient(circle_at_50%_0%,rgba(200,168,110,0.15),transparent_55%)]" />
                </div>
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--arvesta-gold)]/25 bg-[rgba(200,168,110,0.08)]">
                    <c.icon className="h-5 w-5 text-[var(--arvesta-gold)]" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-white">
                    {c.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--arvesta-text-secondary)]">
                    {c.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className="relative px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(200,168,110,0.12),transparent_55%)]" />
        <div
          className={`relative mx-auto max-w-2xl text-center ${ctaVisible ? "anim-reveal-up" : "opacity-0"}`}
        >
          <h2 className="mb-5 font-display text-3xl font-bold text-white md:text-4xl">
            {t("ctaTitle")}
          </h2>
          <p className="mb-8 text-base leading-relaxed text-[var(--arvesta-text-secondary)]">
            {t("ctaDesc")}
          </p>
          <Link
            href={`/${locale}#contact`}
            className="inline-flex items-center gap-2 rounded-full border border-[#ffd8a6]/40 bg-gradient-to-b from-[#f6c583] to-[var(--arvesta-accent)] px-8 py-3.5 font-ui text-sm font-bold text-[#2b160a] shadow-[0_12px_32px_rgba(232,98,44,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1d]"
          >
            {t("ctaBtn")} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
