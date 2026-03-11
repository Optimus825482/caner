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

export default function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const sectionIds = ["savoir-faire", "collections", "export", "contact"];

    const onScroll = () => {
      setScrolled(window.scrollY > 60);

      // Scroll-spy: find which section is in view
      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 200) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  const navLinks = [
    { href: "#savoir-faire", label: t("savoirfaire"), anchor: true },
    { href: "#collections", label: t("collections"), anchor: true },
    { href: "#export", label: t("export"), anchor: true },
    { href: `/${locale}/about`, label: t("about"), anchor: false },
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
          className={`mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/20 bg-gradient-to-r from-[#0b0b0b]/72 via-[#121212]/66 to-[#0b0b0b]/72 backdrop-blur-2xl transition-all duration-300 ${
            scrolled
              ? "px-5 py-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
              : "px-6 py-3"
          }`}
        >
          <Link href={`/${locale}`} className="nav-logo relative -my-5 z-10">
            <Image
              src="/uploads/products/logo.png"
              alt="Arvesta"
              width={scrolled ? 100 : 115}
              height={scrolled ? 100 : 115}
              className="object-contain transition-all duration-200 drop-shadow-[0_4px_16px_rgba(200,168,110,0.35)]"
            />
          </Link>

          <ul className="hidden items-center gap-9 lg:flex">
            {navLinks.map((link) => {
              const sectionId = link.anchor ? link.href.replace("#", "") : "";
              const isActive = link.anchor
                ? activeSection === sectionId
                : pathname === link.href;

              const cls = `relative font-ui text-sm font-medium tracking-[0.03em] transition-colors duration-300 after:absolute after:bottom-[-6px] after:left-0 after:h-px after:bg-gradient-to-r after:from-[#f3c98b] after:to-[var(--arvesta-accent)] after:transition-all after:duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${
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
            <div className="hidden items-center gap-2 md:flex">
              {locales.map((l, i) => (
                <span key={l.code} className="flex items-center gap-2">
                  <button
                    onClick={() => switchLocale(l.code)}
                    className={`rounded-full px-2 py-1 font-ui text-[0.68rem] font-bold tracking-[0.14em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${
                      locale === l.code
                        ? "bg-[#f3c98b]/12 text-[#f3c98b]"
                        : "text-white/60 hover:text-[#f3c98b]"
                    }`}
                  >
                    {l.label}
                  </button>
                  {i < locales.length - 1 && (
                    <span className="text-xs text-white/30 opacity-70">|</span>
                  )}
                </span>
              ))}
            </div>

            <a
              href="#contact"
              className="hidden rounded-full border border-[#ffd8a6]/40 bg-gradient-to-b from-[#f6c583] to-[var(--arvesta-accent)] px-6 py-2.5 font-ui text-sm font-bold text-[#2b160a] shadow-[0_12px_32px_rgba(232,98,44,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] lg:inline-flex"
            >
              {t("quote")}
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="z-[1001] rounded-full border border-white/20 bg-black/20 p-2.5 transition-colors hover:border-[#f3c98b]/50 hover:bg-black/35 lg:hidden"
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
        className={`fixed inset-0 z-[999] flex items-center justify-center bg-[#080808]/96 backdrop-blur-2xl transition-all duration-500 ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/70 px-8 py-10 text-center shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-12">
          <ul className="mb-12 flex flex-col gap-6">
            {navLinks.map((link, i) => {
              const linkCls =
                "font-display text-3xl font-medium text-white transition-all hover:text-[#f3c98b]";
              const style = {
                transitionDelay: `${(i + 1) * 0.05}s`,
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "translateY(0)" : "translateY(20px)",
              };

              return (
                <li key={link.href}>
                  {link.anchor ? (
                    <a
                      href={isHome ? link.href : `/${locale}/${link.href}`}
                      onClick={() => setMobileOpen(false)}
                      className={linkCls}
                      style={style}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={linkCls}
                      style={style}
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
                    : "border-white/15 text-[var(--arvesta-text-muted)] hover:border-[#f3c98b]/40 hover:text-[#f3c98b]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="inline-block rounded-full border border-[#ffd8a6]/40 bg-gradient-to-b from-[#f6c583] to-[var(--arvesta-accent)] px-10 py-3.5 font-ui text-base font-semibold text-[#2b160a] shadow-[0_12px_32px_rgba(232,98,44,0.35)] transition-all duration-200 hover:brightness-110"
          >
            {t("quote")}
          </a>
        </div>
      </div>
    </>
  );
}
