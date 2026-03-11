export default function Marquee() {
  const items = [
    "DESIGN",
    "FABRICATION",
    "QUALITÉ",
    "EXPORT",
    "LUXE",
    "SUR MESURE",
  ];
  const doubled = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-[var(--arvesta-gold)]/30 bg-[linear-gradient(90deg,#040a16_0%,#081328_48%,#040a16_100%)] py-10 md:py-11">
      <div className="overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="inline-flex animate-marquee gap-10 md:gap-12">
          {doubled.map((item, i) => (
            <span key={i} className="flex items-center gap-10 md:gap-12">
              <span className="font-display text-[clamp(1.5rem,4vw,3rem)] font-light tracking-[0.18em] text-white/88">
                {item}
              </span>
              <span className="text-xs text-[var(--arvesta-gold)]/85 md:text-sm">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
