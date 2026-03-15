import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Instagram } from "lucide-react";
import FooterReveal from "./FooterReveal";
import { getPublicSettings } from "@/lib/get-public-settings";

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tf = await getTranslations({ locale, namespace: "filter" });
  const settings = await getPublicSettings();

  return (
    <footer className="relative overflow-hidden border-t border-(--arvesta-gold)/25 bg-[linear-gradient(180deg,#050c19_0%,#040916_100%)] px-6 pb-6 pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(200,168,110,0.13),transparent_32%),radial-gradient(circle_at_90%_84%,rgba(8,18,34,0.56),transparent_44%)]" />

      <div className="relative mx-auto max-w-[1200px]">
        <FooterReveal>
          <div className="mb-12 text-center">
            <Image
              src="/uploads/products/logo.png"
              alt="Arvesta"
              width={200}
              height={200}
              className="mx-auto mb-4 object-contain opacity-85"
            />
            <p className="font-display text-sm italic text-(--arvesta-text-secondary) md:text-base">
              {t("tagline")}
            </p>
          </div>

          <div className="mx-auto mb-12 grid max-w-[560px] grid-cols-2 gap-10 text-center">
            <div>
              <h4 className="mb-4 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-(--arvesta-gold)/95">
                {t("collections")}
              </h4>
              <Link
                href={`/${locale}#collections`}
                className="block rounded-md py-1 text-sm text-(--arvesta-text-secondary) underline-offset-4 transition-colors hover:text-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:underline focus-visible:outline-none"
              >
                {tf("kitchen")}
              </Link>
              <Link
                href={`/${locale}#collections`}
                className="block rounded-md py-1 text-sm text-(--arvesta-text-secondary) underline-offset-4 transition-colors hover:text-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:underline focus-visible:outline-none"
              >
                {tf("wardrobe")}
              </Link>
              <Link
                href={`/${locale}#collections`}
                className="block rounded-md py-1 text-sm text-(--arvesta-text-secondary) underline-offset-4 transition-colors hover:text-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:underline focus-visible:outline-none"
              >
                {tf("bathroom")}
              </Link>
            </div>
            <div>
              <h4 className="mb-4 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-(--arvesta-gold)/95">
                {t("company")}
              </h4>
              <Link
                href={`/${locale}/about`}
                className="block rounded-md py-1 text-sm text-(--arvesta-text-secondary) underline-offset-4 transition-colors hover:text-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:underline focus-visible:outline-none"
              >
                {t("about")}
              </Link>
              <Link
                href={`/${locale}#contact`}
                className="block rounded-md py-1 text-sm text-(--arvesta-text-secondary) underline-offset-4 transition-colors hover:text-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:underline focus-visible:outline-none"
              >
                {t("contact")}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="block rounded-md py-1 text-sm text-(--arvesta-text-secondary) underline-offset-4 transition-colors hover:text-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:underline focus-visible:outline-none"
              >
                {t("privacy")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-(--arvesta-gold)/22 pt-6 text-center md:flex-row">
            <span className="text-xs text-(--arvesta-text-muted)">
              © {new Date().getFullYear()} Arvesta Menuiserie France.{" "}
              {t("rights")}
            </span>
            <div className="flex gap-4">
              <a
                href={settings.instagram || "https://instagram.com/arvesta"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-(--arvesta-gold)/35 bg-[rgba(8,16,30,0.82)] text-(--arvesta-text-secondary) transition-colors hover:border-(--arvesta-gold) hover:bg-[rgba(200,168,110,0.14)] hover:text-(--arvesta-gold) focus-visible:border-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow) focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--arvesta-bg)]"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={settings.whatsapp || "https://wa.me/33143678800"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-(--arvesta-gold)/35 bg-[rgba(8,16,30,0.82)] text-(--arvesta-text-secondary) transition-colors hover:border-(--arvesta-gold) hover:bg-[rgba(200,168,110,0.14)] hover:text-(--arvesta-gold) focus-visible:border-(--arvesta-gold) focus-visible:text-(--arvesta-gold) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arvesta-accent-glow) focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--arvesta-bg)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
              </a>
            </div>
          </div>
        </FooterReveal>
      </div>
    </footer>
  );
}
