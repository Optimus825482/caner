"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

const messages: Record<string, { title: string; retry: string }> = {
  fr: { title: "Une erreur s'est produite", retry: "Réessayer" },
  en: { title: "Something went wrong", retry: "Try again" },
  tr: { title: "Bir hata oluştu", retry: "Tekrar dene" },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = messages[locale] || messages.fr;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--arvesta-bg) px-4 text-center">
      <h2 className="mb-4 font-display text-2xl font-bold text-white">
        {t.title}
      </h2>
      <p className="mb-8 text-sm text-(--arvesta-text-secondary)">
        {error.message || "Something went wrong"}
      </p>
      <button
        onClick={reset}
        className="rounded-full border border-(--arvesta-gold)/40 bg-(--arvesta-gold)/10 px-6 py-2.5 font-ui text-sm font-semibold text-(--arvesta-gold) transition-colors hover:bg-(--arvesta-gold)/20"
      >
        {t.retry}
      </button>
    </div>
  );
}
