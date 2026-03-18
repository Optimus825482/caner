"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const locales = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

export default function Navbar({
  locale,
  logoUrl,
}: {
  locale: string;
  logoUrl?: string;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  const navLinks = [
    { href: `/${locale}`, label: t("home"), anchor: false },
    { href: `/${locale}/about`, label: t("about"), anchor: false },
    { href: `/${locale}/products`, label: t("products"), anchor: false },
    { href: `/${locale}/services`, label: t("services"), anchor: false },
    { href: `/${locale}/blog`, label: t("blog"), anchor: false },
    { href: "#contact", label: t("contact"), anchor: true },
  ];

  function switchLocale(newLocale: string) {
    const currentSegments = pathname.split("/").filter(Boolean);
    const restSegments = currentSegments.slice(1);
    const nextPath = `/${[newLocale, ...restSegments].join("/")}`;

    router.replace(nextPath);
  }

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 px-4 py-4 md:px-10">
        <div
          className={`mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/20 bg-linear-to-r from-[#0b0b0b]/72 via-[#121212]/66 to-[#0b0b0b]/72 backdrop-blur-2xl transition-all duration-300 ${
            scrolled
              ? "px-5 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
              : "px-6 py-2.5"
          }`}
        >
          <Link
            href={`/${locale}`}
            className="nav-logo relative z-10 flex items-center gap-3 -my-8"
          >
            <Image
              src={logoUrl || "/uploads/products/logo.png"}
              alt="Arvesta"
              width={115}
              height={115}
              className={`object-contain transition-all duration-300 drop-shadow-[0_4px_16px_rgba(200,168,110,0.35)] ${
                scrolled ? "h-[50px] w-[50px]" : "h-[60px] w-[60px]"
              }`}
            />
            <span className="leading-tight">
              <span className="block font-brand text-xl tracking-wide text-[#f3c98b] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-[1.6rem]">
                Arvesta
              </span>
              <span className="-mt-0.5 block font-ui text-[0.65rem] font-medium uppercase tracking-[0.18em] text-white/75 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] sm:text-[0.7rem] sm:tracking-[0.25em]">
                Menuiserie France
              </span>
            </span>
          </Link>

          <ul className="hidden items-center gap-7 lg:flex lg:ml-auto lg:mr-6">
            {navLinks.map((link) => {
              const isActive =
                !link.anchor &&
                (link.href === `/${locale}`
                  ? isHome
                  : pathname.startsWith(link.href));

              const cls = `relative font-ui text-base font-medium tracking-[0.03em] transition-colors duration-300 after:absolute after:bottom-[-6px] after:left-0 after:h-px after:bg-linear-to-r after:from-[#f3c98b] after:to-(--arvesta-accent) after:transition-all after:duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${
                isActive
                  ? "text-[#f3c98b] after:w-full"
                  : "text-white/88 after:w-0 hover:text-[#f3c98b] hover:after:w-full"
              }`;

              return (
                <li key={link.href}>
                  {link.anchor ? (
                    <a
                      href={isHome ? link.href : `/${locale}/${link.href}`}
                      className={cls}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={cls}>
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm md:flex">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLocale(l.code)}
                  className={`rounded-full px-3 py-1.5 font-ui text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${
                    locale === l.code
                      ? "bg-[#f3c98b]/15 text-[#f3c98b] shadow-[0_0_12px_rgba(243,201,139,0.1)]"
                      : "text-white/55 hover:text-white/90"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="z-1001 rounded-full border border-white/20 bg-black/20 p-2.5 transition-colors hover:border-[#f3c98b]/50 hover:bg-black/35 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-999 flex items-center justify-center bg-[#080808]/96 backdrop-blur-2xl transition-all duration-500 ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/70 px-8 py-10 text-center shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-12">
          <ul className="mb-12 flex flex-col gap-6">
            {navLinks.map((link, i) => {
              const linkCls =
                "font-display text-3xl font-medium text-white transition-all hover:text-[#f3c98b]";
              const delayClass =
                i === 0
                  ? "anim-delay-50"
                  : i === 1
                    ? "anim-delay-100"
                    : i === 2
                      ? "anim-delay-150"
                      : i === 3
                        ? "anim-delay-200"
                        : "anim-delay-250";
              const stateClass = mobileOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-5 opacity-0";

              return (
                <li key={link.href}>
                  {link.anchor ? (
                    <a
                      href={isHome ? link.href : `/${locale}/${link.href}`}
                      onClick={() => setMobileOpen(false)}
                      className={`${linkCls} ${delayClass} ${stateClass}`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`${linkCls} ${delayClass} ${stateClass}`}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mb-8 flex justify-center gap-4">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  switchLocale(l.code);
                  setMobileOpen(false);
                }}
                className={`rounded-full border px-4 py-2 font-ui text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${
                  locale === l.code
                    ? "border-[#f3c98b]/70 bg-[#f3c98b]/12 text-[#f3c98b]"
                    : "border-white/15 text-(--arvesta-text-muted) hover:border-[#f3c98b]/40 hover:text-[#f3c98b]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="inline-block rounded-full border border-white/15 bg-white/5 px-8 py-3 font-ui text-base font-medium text-white/80 transition-all duration-200 hover:border-[#f3c98b]/40 hover:text-[#f3c98b]"
          >
            {t("contact")}
          </a>
        </div>
      </div>
    </>
  );
}
