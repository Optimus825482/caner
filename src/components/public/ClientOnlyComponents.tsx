"use client";

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

export default function ClientOnlyComponents({
  whatsappUrl,
}: {
  whatsappUrl?: string;
}) {
  return (
    <>
      <WhatsAppFloat whatsappUrl={whatsappUrl} />
      <BackToTop />
      <CookieConsent />
      <Analytics />
    </>
  );
}
