import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Preloader from "@/components/public/Preloader";
import CustomCursor from "@/components/public/CustomCursor";
import WhatsAppFloat from "@/components/public/WhatsAppFloat";
import BackToTop from "@/components/public/BackToTop";
import CookieConsent from "@/components/public/CookieConsent";
import Analytics from "@/components/public/Analytics";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[99999] focus:rounded-md focus:bg-[var(--arvesta-gold)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#2b160a]"
      >
        Skip to content
      </a>
      <Preloader />
      <CustomCursor />
      <div className="flex min-h-dvh flex-col bg-[var(--arvesta-bg)] text-[var(--arvesta-text)]">
        <Navbar locale={locale} />
        <main id="main-content" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <Footer locale={locale} />
      </div>
      <WhatsAppFloat />
      <BackToTop />
      <CookieConsent />
      <Analytics />
    </NextIntlClientProvider>
  );
}
