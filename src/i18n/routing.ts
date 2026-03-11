import { defineRouting } from "next-intl/routing";

// Content source language is French; keep this aligned across public + admin UIs.
export const CONTENT_LOCALE = "fr" as const;

export const routing = defineRouting({
  locales: ["fr", "en", "tr"],
  defaultLocale: CONTENT_LOCALE,
});
