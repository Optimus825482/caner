"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "tr", label: "TR" },
] as const;

export default function AdminLocaleSwitcher() {
  const currentLocale = useLocale();

  function switchLocale(locale: string) {
    document.cookie = `admin-locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <Globe className="w-4 h-4 text-(--arvesta-text-muted) mr-1.5" />
      {LOCALES.map((l) => (
        <Button
          key={l.code}
          variant={currentLocale === l.code ? "default" : "ghost"}
          size="sm"
          onClick={() => switchLocale(l.code)}
          className={`h-7 px-2.5 text-xs font-ui font-semibold ${
            currentLocale === l.code
              ? "bg-(--arvesta-accent) text-white hover:bg-(--arvesta-accent-hover)"
              : "text-(--arvesta-text-muted) hover:text-white hover:bg-white/5"
          }`}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
