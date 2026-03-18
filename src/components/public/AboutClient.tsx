"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import ImageShimmer from "@/components/public/ImageShimmer";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useScrollReveal";
import {
  TreePine,
  Ruler,
  Truck,
  Mail,
  Phone,
  Pencil,
  Factory,
  Wrench,
  PackageCheck,
} from "lucide-react";

export default function AboutClient({
  locale,
  settings = {},
}: {
  locale: string;
  settings?: Record<string, string>;
}) {
  const t = useTranslations("about");
  const ts = useTranslations("teamSection");

  const s = (key: string): string => {
    const settingKey = `about_${key}_${locale}`;
    return settings[settingKey] || t(key as Parameters<typeof t>[0]);
  };

  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const { ref: storyRef, isVisible: storyVisible } = useScrollReveal();
  const { ref: numRef, isVisible: numVisible } = useStaggerReveal(4, 140, 400);
  const { ref: craftRef, isVisible: craftVisible } = useStaggerReveal(
    3,
    160,
    500,
  );
  const { ref: teamRef, isVisible: teamVisible } = useScrollReveal();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();

  interface TeamMember {
    id: string;
    photo: string | null;
    email: string | null;
    phone: string | null;
    role?: string;
    translations: { locale: string; fullName: string; title: string }[];
  }

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch("/api/team?published=true")
      .then((r) => r.json())
      .then((data) => setTeamMembers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const processSteps = [
    {
      icon: Pencil,
      title: s("step1Title"),
      desc: s("step1Desc"),
      location: s("step1Location"),
    },
    {
      icon: Factory,
      title: s("step2Title"),
      desc: s("step2Desc"),
      location: s("step2Location"),
    },
    {
      icon: Wrench,
      title: s("step3Title"),
      desc: s("step3Desc"),
      location: s("step3Location"),
    },
    {
      icon: PackageCheck,
      title: s("step4Title"),
      desc: s("step4Desc"),
      location: s("step4Location"),
    },
  ];

  const crafts = [
    { icon: TreePine, title: s("craft1Title"), desc: s("craft1Desc") },
    { icon: Ruler, title: s("craft2Title"), desc: s("craft2Desc") },
    { icon: Truck, title: s("craft3Title"), desc: s("craft3Desc") },
  ];

  const leads = teamMembers.filter((m) => m.role === "lead");
  const members = teamMembers.filter((m) => m.role !== "lead");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)]">
      {/* Hero */}
      <section className="relative flex min-h-[65vh] items-center justify-center overflow-hidden px-6 pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(241,216,164,0.08),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(10,20,44,0.5),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/uploads/products/kitchen-1.jpg')] bg-cover bg-center opacity-[0.04]" />

        <div
          ref={heroRef}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <span
            className={`mb-5 inline-block font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-(--arvesta-gold)/80 ${heroVisible ? "anim-title-reveal" : "opacity-0"}`}
          >
            {s("heroTag")}
          </span>
          <h1
            className={`mb-7 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-white md:text-6xl lg:text-7xl ${heroVisible ? "anim-reveal-up anim-delay-120" : "opacity-0"}`}
          >
            {s("heroTitle")}
          </h1>
          <p
            className={`mx-auto max-w-xl text-[0.9375rem] leading-[1.75] text-(--arvesta-text-secondary) md:text-base ${heroVisible ? "anim-reveal-up anim-delay-240" : "opacity-0"}`}
          >
            {s("heroDesc")}
          </p>
          <div
            className={`mx-auto mt-12 h-px w-20 bg-linear-to-r from-transparent via-(--arvesta-gold)/50 to-transparent ${heroVisible ? "anim-line-expand anim-delay-360" : "opacity-0 scale-x-0"}`}
          />
        </div>
      </section>

      {/* Story */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div
            ref={storyRef}
            className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24"
          >
            <div
              className={`relative aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.06] shadow-[0_32px_64px_rgba(0,0,0,0.35)] ${storyVisible ? "anim-slide-left" : "opacity-0"}`}
            >
              <ImageShimmer
                src={
                  settings["about_storyImage"] ||
                  "/uploads/products/wardrobe-1.jpg"
                }
                alt="Arvesta atölye"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#050c19]/70 via-transparent to-transparent" />
            </div>

            <div
              className={
                storyVisible ? "anim-slide-right anim-delay-150" : "opacity-0"
              }
            >
              <span className="mb-4 block font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-(--arvesta-gold)/80">
                {s("storyTag")}
              </span>
              <h2 className="mb-7 font-display text-2xl font-semibold leading-tight text-white md:text-3xl lg:text-4xl">
                {s("storyTitle")}
              </h2>
              <p className="mb-6 text-[0.9375rem] leading-[1.8] text-(--arvesta-text-secondary)">
                {s("storyP1")}
              </p>
              <p className="text-[0.9375rem] leading-[1.8] text-(--arvesta-text-secondary)">
                {s("storyP2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="relative overflow-hidden border-y border-white/[0.04] px-6 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(241,216,164,0.04),transparent_65%)]" />
        <div className="relative mx-auto max-w-7xl">
          <span
            className={`mb-4 block text-center font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-(--arvesta-gold)/80 ${numVisible ? "anim-title-reveal" : "opacity-0"}`}
          >
            {s("processTag")}
          </span>
          <h2
            className={`mb-14 text-center font-display text-2xl font-semibold text-white md:text-3xl lg:text-4xl ${numVisible ? "anim-reveal-up anim-delay-100" : "opacity-0"}`}
          >
            {s("processTitle")}
          </h2>
          <div
            ref={numRef}
            className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {/* Connecting line (desktop) */}
            <div className="pointer-events-none absolute top-16 right-12 left-12 hidden h-px bg-gradient-to-r from-transparent via-(--arvesta-gold)/25 to-transparent lg:block" />

            {processSteps.map((step, i) => (
              <div
                key={i}
                className={`group relative flex flex-col items-center text-center ${numVisible ? "anim-reveal-up" : "opacity-0"}`}
              >
                {/* Step number */}
                <div className="relative mb-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-(--arvesta-gold)/20 bg-(--arvesta-gold)/5 transition-all duration-300 group-hover:border-(--arvesta-gold)/40 group-hover:bg-(--arvesta-gold)/10 group-hover:shadow-[0_0_24px_rgba(241,216,164,0.12)]">
                    <step.icon className="h-6 w-6 text-(--arvesta-gold)/80 transition-colors group-hover:text-(--arvesta-gold)" />
                  </div>
                </div>

                <h3 className="mb-2 font-display text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mb-3 text-[0.8125rem] leading-[1.7] text-(--arvesta-text-secondary)">
                  {step.desc}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 rounded-full border border-(--arvesta-gold)/10 bg-(--arvesta-gold)/5 px-3 py-1 font-ui text-[10px] font-medium uppercase tracking-[0.08em] text-(--arvesta-gold)/70">
                  {step.location}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craft / Approach */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center md:mb-16">
            <span
              className={`mb-4 block font-ui text-[10px] font-semibold uppercase tracking-[0.25em] text-(--arvesta-gold)/80 ${craftVisible ? "anim-title-reveal" : "opacity-0"}`}
            >
              {s("craftTag")}
            </span>
            <h2
              className={`font-display text-2xl font-semibold text-white md:text-3xl lg:text-4xl ${craftVisible ? "anim-reveal-up anim-delay-100" : "opacity-0"}`}
            >
              {s("craftTitle")}
            </h2>
          </div>

          <div ref={craftRef} className="grid gap-6 md:grid-cols-3 md:gap-8">
            {crafts.map((c, i) => (
              <article
                key={i}
                className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm transition-all duration-300 hover:border-(--arvesta-gold)/20 hover:bg-white/[0.04] md:p-10 ${craftVisible ? "anim-reveal-up" : "opacity-0"}`}
              >
                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-(--arvesta-gold)/15 bg-(--arvesta-gold)/5">
                    <c.icon className="h-5 w-5 text-(--arvesta-gold)/90" />
                  </div>
                  <h3 className="mb-3 font-display text-lg font-semibold text-white">
                    {c.title}
                  </h3>
                  <p className="text-[0.9375rem] leading-[1.7] text-(--arvesta-text-secondary)">
                    {c.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section
        ref={teamRef}
        className={`relative px-6 ${teamMembers.length > 0 ? "py-16 md:py-24" : "py-0"}`}
      >
        {teamMembers.length > 0 && (
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center md:mb-16">
              <span
                className={`mb-3 block font-ui text-[11px] font-bold uppercase tracking-[0.22em] text-(--arvesta-gold)/90 ${teamVisible ? "anim-title-reveal" : "opacity-0"}`}
              >
                {ts("tag")}
              </span>
              <h2
                className={`mb-3 font-display text-3xl font-bold text-white md:text-4xl ${teamVisible ? "anim-reveal-up anim-delay-100" : "opacity-0"}`}
              >
                {ts("title")}
              </h2>
              <p
                className={`mx-auto max-w-xl text-base text-(--arvesta-text-secondary) ${teamVisible ? "anim-reveal-up anim-delay-200" : "opacity-0"}`}
              >
                {ts("subtitle")}
              </p>
            </div>

            {/* Leads (Yönetici/Kurucu) - üstte, daha büyük kartlar */}
            {leads.length > 0 && (
              <div className="mb-12">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {leads
                    .map((member) => {
                      const tr =
                        member.translations.find((t) => t.locale === locale) ||
                        member.translations.find((t) => t.locale === "fr") ||
                        member.translations[0];
                      if (!tr) return null;
                      return { member, tr };
                    })
                    .filter(Boolean)
                    .map(({ member, tr }) => (
                      <article
                        key={member.id}
                        className={`group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-(--arvesta-gold)/20 hover:bg-white/[0.04] hover:-translate-y-0.5 ${teamVisible ? "anim-reveal-up" : "opacity-0"}`}
                      >
                        {member.photo ? (
                          <div className="relative mx-auto mb-6 h-28 w-28 overflow-hidden rounded-full border-2 border-(--arvesta-gold)/15">
                            <Image
                              src={member.photo}
                              alt={tr.fullName}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="112px"
                              unoptimized={member.photo.startsWith("http")}
                            />
                          </div>
                        ) : (
                          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-(--arvesta-gold)/15 bg-(--arvesta-gold)/5 font-display text-3xl font-semibold text-(--arvesta-gold)/70">
                            {tr.fullName.charAt(0)}
                          </div>
                        )}
                        <h3 className="mb-2 font-display text-xl font-semibold text-white">
                          {tr.fullName}
                        </h3>
                        {tr.title && (
                          <p className="mb-5 font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-(--arvesta-gold)/80">
                            {tr.title}
                          </p>
                        )}
                        <div className="space-y-2">
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="flex items-center justify-center gap-2 text-xs text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          )}
                          {member.phone && (
                            <a
                              href={`tel:${member.phone}`}
                              className="flex items-center justify-center gap-2 text-xs text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{member.phone}</span>
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            )}

            {/* Members - altta */}
            {members.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members
                  .map((member) => {
                    const tr =
                      member.translations.find((t) => t.locale === locale) ||
                      member.translations.find((t) => t.locale === "fr") ||
                      member.translations[0];
                    if (!tr) return null;
                    return { member, tr };
                  })
                  .filter(Boolean)
                  .map(({ member, tr }) => (
                    <article
                      key={member.id}
                      className={`group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-(--arvesta-gold)/20 hover:bg-white/[0.04] hover:-translate-y-0.5 ${teamVisible ? "anim-reveal-up" : "opacity-0"}`}
                    >
                      {member.photo ? (
                        <div className="relative mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border-2 border-(--arvesta-gold)/15">
                          <Image
                            src={member.photo}
                            alt={tr.fullName}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="96px"
                            unoptimized={member.photo.startsWith("http")}
                          />
                        </div>
                      ) : (
                        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-(--arvesta-gold)/15 bg-(--arvesta-gold)/5 font-display text-2xl font-semibold text-(--arvesta-gold)/70">
                          {tr.fullName.charAt(0)}
                        </div>
                      )}
                      <h3 className="mb-1 font-display text-lg font-semibold text-white">
                        {tr.fullName}
                      </h3>
                      {tr.title && (
                        <p className="mb-4 font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-(--arvesta-gold)/80">
                          {tr.title}
                        </p>
                      )}
                      <div className="space-y-1.5">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center justify-center gap-2 text-xs text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </a>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center justify-center gap-2 text-xs text-(--arvesta-text-secondary) transition-colors hover:text-(--arvesta-gold)"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{member.phone}</span>
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl">
          <div
            className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-sm md:p-12 ${ctaVisible ? "anim-reveal-up" : "opacity-0"}`}
          >
            <h2 className="mb-4 font-display text-2xl font-semibold text-white md:text-3xl">
              {s("ctaTitle")}
            </h2>
            <p className="mb-8 text-[0.9375rem] leading-[1.75] text-(--arvesta-text-secondary)">
              {s("ctaDesc")}
            </p>
            <Link
              href={`/${locale}#contact`}
              className="inline-flex items-center gap-2 rounded-full border border-(--arvesta-gold)/40 bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) px-8 py-3.5 font-ui text-sm font-bold text-[#2b160a] shadow-[0_12px_32px_rgba(232,98,44,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-gold) focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1d]"
            >
              {s("ctaBtn")} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
