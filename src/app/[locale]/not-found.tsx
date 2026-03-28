import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

const fallback: Record<string, { title: string; desc: string; btn: string }> = {
  fr: {
    title: "Page introuvable",
    desc: "La page que vous recherchez n'existe pas ou a été déplacée.",
    btn: "Retour à l'accueil",
  },
  en: {
    title: "Page not found",
    desc: "The page you are looking for does not exist or has been moved.",
    btn: "Back to home",
  },
  tr: {
    title: "Sayfa bulunamadı",
    desc: "Aradığınız sayfa mevcut değil veya taşınmış olabilir.",
    btn: "Ana sayfaya dön",
  },
};

export default async function NotFound() {
  let locale = "fr";
  try {
    locale = await getLocale();
  } catch {
    // fallback to fr
  }

  const t = fallback[locale] || fallback.fr;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--arvesta-bg) px-4 text-center">
      <p className="mb-2 font-ui text-xs font-semibold uppercase tracking-[0.24em] text-(--arvesta-gold)/80">
        404
      </p>
      <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
        {t.title}
      </h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-(--arvesta-text-secondary)">
        {t.desc}
      </p>
      <Link
        href={`/${locale}`}
        className="rounded-full border border-(--arvesta-gold)/40 bg-(--arvesta-gold)/10 px-6 py-2.5 font-ui text-sm font-semibold text-(--arvesta-gold) transition-colors hover:bg-(--arvesta-gold)/20"
      >
        {t.btn}
      </Link>
    </div>
  );
}
