"use client";

import { useEffect, useState } from "react";

/**
 * Lazy-loads Material Symbols Outlined font only when needed.
 * Prevents ~200KB+ render-blocking CSS on pages that don't use it.
 */
export default function MaterialSymbolsLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";
    link.onload = () => setLoaded(true);
    document.head.appendChild(link);
  }, [loaded]);

  return null;
}
