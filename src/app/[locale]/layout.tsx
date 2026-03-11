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
      <Preloader />
      <CustomCursor />
      <div className="flex min-h-dvh flex-col bg-[var(--arvesta-bg)] text-[var(--arvesta-text)]">
        <Navbar locale={locale} />
        <main className="flex-1 overflow-x-clip">{children}</main>
        <Footer locale={locale} />
      </div>
      <WhatsAppFloat />
      <BackToTop />
      <CookieConsent />
      <Analytics />
    </NextIntlClientProvider>
  );
}
