"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function FooterReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <div ref={ref} className={isVisible ? "anim-reveal-up" : "opacity-0"}>
      {children}
    </div>
  );
}
