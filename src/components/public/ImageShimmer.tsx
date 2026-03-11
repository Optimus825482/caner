"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

// Generates a tiny SVG shimmer as base64 placeholder
function shimmerSvg(w: number, h: number): string {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0a1528" />
        <stop offset="50%" stop-color="#162240" />
        <stop offset="100%" stop-color="#0a1528" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)">
      <animate attributeName="x" from="-${w}" to="${w}" dur="1.5s" repeatCount="indefinite" />
    </rect>
  </svg>`;
}

function toBase64(str: string) {
  return typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);
}

export default function ImageShimmer({ className = "", ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmerSvg(16, 9))}`}
      onLoad={() => setLoaded(true)}
    />
  );
}
