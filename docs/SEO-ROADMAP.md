# Arvesta SEO Roadmap — İmplementasyon Takip

**Oluşturulma:** 27 Mart 2026
**Kaynak:** ARAMAMOTORLARI.md analiz raporu

---

## FAZ 1 — Kritik Düzeltmeler ✅ TAMAMLANDI

| #   | Görev                                                                | Dosya(lar)                              | Durum |
| --- | -------------------------------------------------------------------- | --------------------------------------- | ----- |
| 1.1 | metadataBase URL düzelt (`arvestafrance.com` → `arvesta-france.com`) | `src/app/layout.tsx`                    | ✅    |
| 1.2 | Product schema'dan Offer bloğunu kaldır (price:"0" sorunu)           | `src/lib/seo.ts` → `productJsonLd()`    | ✅    |
| 1.3 | Organization + FurnitureStore logo path düzelt (`/logo.png`)         | `src/lib/seo.ts`                        | ✅    |
| 1.4 | WebSite SearchAction kaldır + inLanguage ekle                        | `src/lib/seo.ts` → `websiteJsonLd()`    | ✅    |
| 1.5 | Sitemap'e eksik sayfaları ekle (`/services`, `/products`)            | `src/app/sitemap.ts`                    | ✅    |
| 1.6 | Security headers ekle (HSTS, X-Frame-Options, vb.)                   | `next.config.ts`                        | ✅    |
| 1.7 | Robots.txt'e Googlebot-Image kuralı + `/_next/` disallow             | `src/app/robots.ts`                     | ✅    |
| 1.8 | Ana sayfaya sabit H1 ekle (sr-only, locale bazlı) + WebSite schema   | `src/app/[locale]/page.tsx`             | ✅    |
| 1.9 | Blog article schema'da logo path düzelt                              | `src/app/[locale]/blog/[slug]/page.tsx` | ✅    |

---

## FAZ 2 — Schema Zenginleştirme ✅ TAMAMLANDI

| #    | Görev                                                         | Dosya(lar)                           | Durum             |
| ---- | ------------------------------------------------------------- | ------------------------------------ | ----------------- |
| 2.1  | `serviceJsonLd()` fonksiyonu oluştur                          | `src/lib/seo.ts`                     | ✅                |
| 2.2  | Services sayfasına Service schema ekle                        | `src/app/[locale]/services/page.tsx` | ✅                |
| 2.3  | `aboutPageJsonLd()` fonksiyonu oluştur                        | `src/lib/seo.ts`                     | ✅                |
| 2.4  | About sayfasına AboutPage schema ekle                         | `src/app/[locale]/about/page.tsx`    | ✅                |
| 2.5  | `blogListJsonLd()` fonksiyonu oluştur                         | `src/lib/seo.ts`                     | ✅                |
| 2.6  | Blog listesine Blog schema ekle                               | `src/app/[locale]/blog/page.tsx`     | ✅                |
| 2.7  | `productListJsonLd()` fonksiyonu oluştur                      | `src/lib/seo.ts`                     | ✅                |
| 2.8  | Products listesine ItemList schema ekle                       | `src/app/[locale]/products/page.tsx` | ✅                |
| 2.9  | Privacy sayfasına BreadcrumbList + OpenGraph ekle             | `src/app/[locale]/privacy/page.tsx`  | ✅                |
| 2.10 | FurnitureStore schema genişlet (telefon, saat, ödeme, sameAs) | `src/lib/seo.ts`                     | ⬜ Gelecek sprint |

---

## FAZ 3 — Yapısal İyileştirmeler ✅ TAMAMLANDI

| #   | Görev                                                 | Dosya(lar)                                 | Durum             |
| --- | ----------------------------------------------------- | ------------------------------------------ | ----------------- |
| 3.1 | Footer `<h4>` → `<span>` dönüşümü (semantic düzeltme) | `src/components/public/Footer.tsx`         | ✅                |
| 3.2 | Footer'a Services ve Products linkleri ekle           | `src/components/public/Footer.tsx`         | ✅                |
| 3.3 | `llms.txt` dosyası oluştur (AI crawler'lar için)      | `public/llms.txt`                          | ✅                |
| 3.4 | Catalog breadcrumb'da hardcoded Türkçe düzelt         | `src/app/[locale]/catalog/[slug]/page.tsx` | ⬜ Gelecek sprint |

---

## FAZ 4 — RGPD / Uyumluluk (Ayrı Sprint)

| #   | Görev                                          | Dosya(lar)                                | Durum |
| --- | ---------------------------------------------- | ----------------------------------------- | ----- |
| 4.1 | Cookie consent'e "Personnaliser" seçeneği ekle | `src/components/public/CookieConsent.tsx` | ⬜    |
| 4.2 | GA script'i consent'e bağla                    | Analytics bileşeni                        | ⬜    |

---

## FAZ 5 — İçerik & Büyüme (Gelecek Sprintler)

| #    | Görev                                                | Tür          | Durum |
| ---- | ---------------------------------------------------- | ------------ | ----- |
| 5.1  | Google Search Console kurulumu + sitemap submit      | Manuel       | ⬜    |
| 5.2  | Bing Webmaster Tools kurulumu                        | Manuel       | ⬜    |
| 5.3  | Google Business Profile oluştur (Paris)              | Manuel       | ⬜    |
| 5.4  | İlk 3 blog yazısını yayınla (GEO optimize)           | İçerik       | ⬜    |
| 5.5  | Pinterest France profili + pin'ler                   | Manuel       | ⬜    |
| 5.6  | Houzz France profili                                 | Manuel       | ⬜    |
| 5.7  | Dizin kayıtları (Pages Jaunes, Europages, Kompass)   | Manuel       | ⬜    |
| 5.8  | Site içi arama sayfası oluştur + SearchAction schema | Kod          | ⬜    |
| 5.9  | Müşteri yorumları sistemi + AggregateRating schema   | Kod          | ⬜    |
| 5.10 | Almanca (de) locale planlama                         | Kod + İçerik | ⬜    |
