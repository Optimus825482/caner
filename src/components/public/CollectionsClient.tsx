"use client";

import ImageShimmer from "@/components/public/ImageShimmer";
import Link from "next/link";
import { useStaggerReveal } from "@/hooks/useScrollReveal";

interface CategoryItem {
  id: string;
  slug: string;
  image: string | null;
  name: string;
  description: string;
}

export default function CollectionsClient({
  categories,
  locale,
  tag,
  title,
  desc,
  explore,
}: {
  categories: CategoryItem[];
  locale: string;
  tag: string;
  title: string;
  desc: string;
  explore: string;
}) {
  const { ref: headerRef, isVisible: headerVisible } = useStaggerReveal(1);
  const {
    ref: gridRef,
    isVisible: gridVisible,
    getDelay,
  } = useStaggerReveal(categories.length, 120, 600);

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#061024_0%,#040a18_55%,#030712_100%)] px-4 py-24 md:py-28"
      id="savoir-faire"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(200,168,110,0.2),transparent_42%),radial-gradient(circle_at_88%_80%,rgba(20,34,62,0.6),transparent_48%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div ref={headerRef} className="mb-16 text-center md:mb-20">
          <h2
            className={`mb-4 font-ui text-xs font-bold uppercase tracking-[0.24em] text-[var(--arvesta-gold)]/90 ${headerVisible ? "anim-title-reveal" : "opacity-0"}`}
          >
            {tag}
          </h2>
          <h3
            className={`mb-5 font-display text-4xl font-bold leading-tight text-white md:text-5xl ${headerVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.12s" }}
          >
            {title}
          </h3>
          <p
            className={`mx-auto max-w-2xl text-sm leading-relaxed text-[var(--arvesta-text-secondary)] md:text-[1.02rem] ${headerVisible ? "anim-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "0.24s" }}
          >
            {desc}
          </p>
          <div
            className={`mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-[var(--arvesta-gold)]/75 to-transparent ${headerVisible ? "anim-line-expand" : "opacity-0 scale-x-0"}`}
            style={{ animationDelay: "0.36s" }}
          />
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-8"
        >
          {categories.map((cat, i) => (
            <article
              key={cat.id}
              className={`tilt-card group relative overflow-hidden rounded-3xl border border-[var(--arvesta-gold)]/30 bg-[linear-gradient(160deg,rgba(10,21,42,0.94)_0%,rgba(5,11,24,0.98)_100%)] shadow-[0_22px_50px_rgba(2,8,20,0.5)] transition-all duration-500 hover:border-[var(--arvesta-gold)]/55 ${gridVisible ? "anim-reveal-up" : "opacity-0"}`}
              style={{ animationDelay: `${getDelay(i)}ms` }}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="h-full w-full bg-[radial-gradient(circle_at_75%_18%,rgba(200,168,110,0.24),transparent_46%)]" />
              </div>

              <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--arvesta-gold)]/25">
                <ImageShimmer
                  src={cat.image || "/uploads/products/kitchen-1.jpg"}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020611]/92 via-[#020611]/30 to-transparent" />
                <div className="absolute left-5 top-5 font-display text-5xl font-bold leading-none text-[var(--arvesta-gold)]/30 md:text-6xl">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="relative space-y-4 p-7 md:p-8">
                <h4 className="font-display text-2xl font-bold leading-snug text-white md:text-[1.72rem]">
                  {cat.name}
                </h4>
                <p className="text-sm leading-relaxed text-[var(--arvesta-text-secondary)] md:text-[0.98rem]">
                  {cat.description}
                </p>
                <Link
                  href={`/${locale}/collections/${cat.slug}`}
                  className="inline-flex items-center gap-2 border-b border-[var(--arvesta-gold)]/45 pb-0.5 font-ui text-xs font-bold uppercase tracking-[0.16em] text-[var(--arvesta-gold)] transition-all hover:gap-3 hover:border-[var(--arvesta-gold)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arvesta-gold)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040b19]"
                >
                  {explore} <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
