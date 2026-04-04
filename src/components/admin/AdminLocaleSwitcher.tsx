"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "tr", label: "TR" },
] as const;

export default function AdminLocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();

  async function switchLocale(locale: string) {
    await fetch("/api/admin-locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    router.refresh();
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
