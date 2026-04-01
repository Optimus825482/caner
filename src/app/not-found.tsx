import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page introuvable",
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070d1a] px-4 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#f1d8a4]/80">
        404
      </p>
      <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
        Page introuvable
      </h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-[#c2baab]">
        La page que vous recherchez n&apos;existe pas.
      </p>
      <Link
        href="/"
        className="rounded-full border border-[#f1d8a4]/40 bg-[#f1d8a4]/10 px-6 py-2.5 text-sm font-semibold text-[#f1d8a4] transition-colors hover:bg-[#f1d8a4]/20"
      >
        Accueil
      </Link>
    </div>
  );
}
