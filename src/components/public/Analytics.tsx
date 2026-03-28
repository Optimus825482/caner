"use client";

import Script from "next/script";
import { useState, useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    function check() {
      const consent = localStorage.getItem("arvesta-cookie-consent");
      const analyticsFlag = localStorage.getItem("arvesta-analytics");
      // Load GA only if consent is "accepted" or custom with analytics=true
      setAllowed(
        consent === "accepted" ||
          (consent === "custom" && analyticsFlag === "true"),
      );
    }
    check();
    window.addEventListener("consent-update", check);
    return () => window.removeEventListener("consent-update", check);
  }, []);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}
