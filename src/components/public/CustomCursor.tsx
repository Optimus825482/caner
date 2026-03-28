"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Only on desktop with fine pointer
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    const interactiveSelector =
      "a, button, [role='button'], input, textarea, select";

    const setVisible = (nextVisible: boolean) => {
      visibleRef.current = nextVisible;
      if (dotRef.current) {
        dotRef.current.style.opacity = nextVisible ? "1" : "0";
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = nextVisible ? "" : "0";
      }
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visibleRef.current) setVisible(true);
      if (dotRef.current) {
        dotRef.current.style.left = `${mouseX}px`;
        dotRef.current.style.top = `${mouseY}px`;
      }
    };

    const onInteractiveHover = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) {
        setHovering(false);
        return;
      }

      setHovering(Boolean(target.closest(interactiveSelector)));
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    // Smooth ring follow with RAF
    let raf = 0;
    const animate = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.left = `${ringX}px`;
        ringRef.current.style.top = `${ringY}px`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onInteractiveHover);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onInteractiveHover);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed z-9999 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--arvesta-accent) opacity-0 transition-transform duration-75"
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed z-9998 -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--arvesta-accent) opacity-0 transition-all duration-200 ${
          hovering
          ? "h-14 w-14 border-(--arvesta-accent-hover) opacity-80"
            : "h-9 w-9 opacity-50"
          }`}
      />
    </>
  );
}
