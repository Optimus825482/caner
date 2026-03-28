export default function Marquee() {
  const items = [
    "DESIGN",
    "FABRICATION",
    "QUALITÉ",
    "EXPORT",
    "LUXE",
    "SUR MESURE",
  ];

  const track = items.map((item, i) => (
    <span key={i} className="flex shrink-0 items-center gap-10 md:gap-12">
      <span className="font-display text-[clamp(1.5rem,4vw,3rem)] font-light tracking-[0.18em] text-white/88">
        {item}
      </span>
      <span className="text-xs text-(--arvesta-gold)/85 md:text-sm">◆</span>
    </span>
  ));

  return (
    <section className="overflow-hidden border-y border-(--arvesta-gold)/30 bg-[linear-gradient(90deg,#040a16_0%,#081328_48%,#040a16_100%)] py-10 md:py-11">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-10 md:gap-12">
          {track}
          {track}
        </div>
      </div>
    </section>
  );
}
