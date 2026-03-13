import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Sora } from "next/font/google";
import "./globals.css";

import { getLocale } from "next-intl/server";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arvesta Menuiserie France — Premium Interior Design",
  description:
    "Mobilier sur mesure de haute qualité. Cuisines, salles de bains, dressings et projets personnalisés. Fabriqué en Turquie, livré en Europe.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    images: [
      { url: "/image.png", width: 512, height: 512, alt: "Arvesta logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/image.png"],
  },
  other: {
    "theme-color": "#d4af6a",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${cormorant.variable} ${sora.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
