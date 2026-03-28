"use client";

import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "dev";

/**
 * Detects stale browser cache after a new deploy.
 * Compares the build ID baked into JS at build time with the one stored
 * in localStorage. On mismatch → hard reload so the browser fetches
 * fresh assets (CSS/JS/RSC).
 *
 * Runs once on mount, invisible to the user.
 */
export default function BuildVersionChecker() {
  useEffect(() => {
    const STORAGE_KEY = "arvesta_build_id";
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && stored !== BUILD_ID && BUILD_ID !== "dev") {
      localStorage.setItem(STORAGE_KEY, BUILD_ID);
      // Hard reload — bypasses browser cache
      window.location.reload();
      return;
    }

    if (!stored || stored !== BUILD_ID) {
      localStorage.setItem(STORAGE_KEY, BUILD_ID);
    }
  }, []);

  return null;
}
