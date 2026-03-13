"use client";

import { Home, CheckCircle } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface ExportTexts {
  tag: string;
  title: string;
  desc: string;
  network: string;
  networkDesc: string;
  quality: string;
  qualityDesc: string;
  from: string;
  to: string;
}

export default function ExportSectionClient({ texts }: { texts: ExportTexts }) {
  const { ref: mapRef, isVisible: mapVisible } = useScrollReveal();
  const { ref: contentRef, isVisible: contentVisible } = useScrollReveal();

  return (
    <section
      className="relative overflow-hidden border-t border-(--arvesta-gold)/25 bg-[linear-gradient(180deg,#050d1d_0%,#040a16_54%,#030813_100%)] px-4 py-24 md:py-28"
      id="export"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(200,168,110,0.2),transparent_35%),radial-gradient(circle_at_86%_82%,rgba(9,18,37,0.62),transparent_50%)]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        {/* Map Side */}
        <div
          ref={mapRef}
          className={`relative ${mapVisible ? "anim-reveal-left" : "opacity-0"}`}
        >
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-(--arvesta-gold)/20 blur-3xl" />
          <div
            className="relative aspect-2/1 w-full overflow-hidden rounded-3xl border border-(--arvesta-gold)/30 bg-[linear-gradient(145deg,rgba(8,18,37,0.97),rgba(4,10,20,0.97))] shadow-[0_26px_58px_rgba(2,8,20,0.52)]"
            style={{
              background:
                "radial-gradient(circle at 30% 50%, rgba(200,168,110,0.2) 0%, transparent 42%), radial-gradient(circle at 72% 58%, rgba(31,54,93,0.25) 0%, transparent 40%), linear-gradient(145deg, rgba(8,18,37,0.97), rgba(4,10,20,0.97))",
            }}
          >
            <div className="group absolute left-[30%] top-[40%] h-3 w-3 cursor-pointer rounded-full bg-(--arvesta-accent)">
              <div className="absolute -inset-1.5 animate-dot-pulse rounded-full border border-(--arvesta-accent)" />
              <span className="pointer-events-none absolute bottom-[120%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-(--arvesta-gold)/30 bg-[#050c1b]/92 px-2 py-1 font-ui text-[0.7rem] text-(--arvesta-text-secondary) opacity-0 transition-opacity group-hover:opacity-100">
                Paris, France
              </span>
            </div>
            <div className="group absolute left-[33%] top-[33%] h-3 w-3 cursor-pointer rounded-full bg-(--arvesta-gold)">
              <div className="absolute -inset-1.5 animate-dot-pulse rounded-full border border-(--arvesta-gold)" />
              <span className="pointer-events-none absolute bottom-[120%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-(--arvesta-gold)/30 bg-[#050c1b]/92 px-2 py-1 font-ui text-[0.7rem] text-(--arvesta-text-secondary) opacity-0 transition-opacity group-hover:opacity-100">
                Belgique
              </span>
            </div>
            <div className="group absolute left-[75%] top-[53%] h-3 w-3 cursor-pointer rounded-full bg-(--arvesta-accent)">
              <div className="absolute -inset-1.5 animate-dot-pulse rounded-full border border-(--arvesta-accent)" />
              <span className="pointer-events-none absolute bottom-[120%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-(--arvesta-gold)/30 bg-[#050c1b]/92 px-2 py-1 font-ui text-[0.7rem] text-(--arvesta-text-secondary) opacity-0 transition-opacity group-hover:opacity-100">
                Aksaray, Türkiye
              </span>
            </div>

            <svg className="absolute inset-0 opacity-50" viewBox="0 0 600 300">
              <path
                d="M450,200 Q350,100 180,120"
                stroke="var(--arvesta-gold)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="8 4"
                opacity="0.78"
                className={mapVisible ? "anim-svg-draw" : ""}
                style={{ animationDelay: "0.5s" }}
              />
              <path
                d="M450,200 Q380,130 200,100"
                stroke="var(--arvesta-gold)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="6 4"
                opacity="0.55"
                className={mapVisible ? "anim-svg-draw" : ""}
                style={{ animationDelay: "0.8s" }}
              />
            </svg>
          </div>

          <div
            className={`absolute -bottom-6 -right-2 z-20 max-w-[250px] rounded-2xl border border-(--arvesta-gold)/40 bg-[rgba(6,13,26,0.88)] p-6 shadow-xl backdrop-blur-[12px] ${mapVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.4s" }}
          >
            <p className="mb-2 font-ui text-xs font-bold uppercase tracking-[0.15em] text-(--arvesta-gold)">
              Production Hub
            </p>
            <p className="font-display text-lg italic leading-snug text-white">
              From Aksaray to the heart of Europe.
            </p>
          </div>
        </div>

        {/* Content Side */}
        <div ref={contentRef} className="space-y-8 md:space-y-10">
          <div>
            <h2
              className={`mb-3 font-ui text-xs font-bold uppercase tracking-[0.24em] text-(--arvesta-gold) ${contentVisible ? "anim-title-reveal" : "opacity-0"}`}
            >
              {texts.tag}
            </h2>
            <h3
              className={`mb-6 font-display text-4xl font-bold leading-tight text-white md:text-5xl ${contentVisible ? "anim-reveal-up" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              {texts.title}
            </h3>
            <p
              className={`max-w-xl text-lg leading-relaxed text-(--arvesta-text-secondary) ${contentVisible ? "anim-reveal-up" : "opacity-0"}`}
              style={{ animationDelay: "0.2s" }}
            >
              {texts.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className={`tilt-card rounded-2xl border border-(--arvesta-gold)/28 bg-[linear-gradient(150deg,rgba(10,21,40,0.9),rgba(6,13,26,0.95))] p-6 shadow-[0_16px_36px_rgba(2,8,20,0.4)] transition-colors hover:border-(--arvesta-gold)/60 ${contentVisible ? "anim-reveal-up" : "opacity-0"}`}
              style={{ animationDelay: "0.3s" }}
            >
              <Home
                className="mb-4 h-10 w-10 text-(--arvesta-gold)"
                strokeWidth={1.5}
              />
              <h4 className="mb-2 font-ui text-sm font-bold uppercase tracking-[0.1em] text-white">
                {texts.network}
              </h4>
              <p className="text-sm leading-relaxed text-(--arvesta-text-secondary)">
                {texts.networkDesc}
              </p>
            </div>

            <div
              className={`tilt-card rounded-2xl border border-(--arvesta-gold)/28 bg-[linear-gradient(150deg,rgba(10,21,40,0.9),rgba(6,13,26,0.95))] p-6 shadow-[0_16px_36px_rgba(2,8,20,0.4)] transition-colors hover:border-(--arvesta-gold)/60 ${contentVisible ? "anim-reveal-up" : "opacity-0"}`}
              style={{ animationDelay: "0.42s" }}
            >
              <CheckCircle
                className="mb-4 h-10 w-10 text-(--arvesta-gold)"
                strokeWidth={1.5}
              />
              <h4 className="mb-2 font-ui text-sm font-bold uppercase tracking-[0.1em] text-white">
                {texts.quality}
              </h4>
              <p className="text-sm leading-relaxed text-(--arvesta-text-secondary)">
                {texts.qualityDesc}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-4 ${contentVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.52s" }}
          >
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-(--arvesta-text-muted)" />
              <span className="font-ui text-[0.8rem] text-(--arvesta-text-secondary)">
                {texts.from}
              </span>
            </div>
            <div
              className="h-px flex-1"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(200,168,110,0.55) 0px, rgba(200,168,110,0.55) 4px, transparent 4px, transparent 8px)",
              }}
            />
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-(--arvesta-gold) bg-(--arvesta-gold)" />
              <span className="font-ui text-[0.8rem] text-(--arvesta-text-secondary)">
                {texts.to}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
