import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Preloader from "@/components/public/Preloader";
import CustomCursor from "@/components/public/CustomCursor";
import dynamic from "next/dynamic";
const WhatsAppFloat = dynamic(
  () => import("@/components/public/WhatsAppFloat"),
  { ssr: false },
);
const BackToTop = dynamic(() => import("@/components/public/BackToTop"), {
  ssr: false,
});
const CookieConsent = dynamic(
  () => import("@/components/public/CookieConsent"),
  { ssr: false },
);
const Analytics = dynamic(() => import("@/components/public/Analytics"), {
  ssr: false,
});
import { getPublicSettings } from "@/lib/get-public-settings";

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

  const [messages, settings] = await Promise.all([
    import(`@/i18n/messages/${locale}.json`).then((m) => m.default),
    getPublicSettings(),
  ]);
  const logoUrl = settings.site_logo || "/uploads/products/logo.png";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-99999 focus:rounded-md focus:bg-(--arvesta-gold) focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#2b160a]"
      >
        Skip to content
      </a>
      <Preloader logoUrl={logoUrl} />
      <CustomCursor />
      <div className="flex min-h-dvh flex-col bg-(--arvesta-bg) text-(--arvesta-text)">
        <Navbar locale={locale} logoUrl={logoUrl} />
        <main id="main-content" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <Footer locale={locale} />
      </div>
      <WhatsAppFloat whatsappUrl={settings.whatsapp} />
      <BackToTop />
      <CookieConsent />
      <Analytics />
    </NextIntlClientProvider>
  );
}
