import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--arvesta-bg) px-4 text-center">
      <p className="mb-2 font-ui text-xs font-semibold uppercase tracking-[0.24em] text-(--arvesta-gold)/80">
        404
      </p>
      <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
        Page introuvable
      </h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-(--arvesta-text-secondary)">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/fr"
        className="rounded-full border border-(--arvesta-gold)/40 bg-(--arvesta-gold)/10 px-6 py-2.5 font-ui text-sm font-semibold text-(--arvesta-gold) transition-colors hover:bg-(--arvesta-gold)/20"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
