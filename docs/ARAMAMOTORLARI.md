# Arvesta SEO & GEO Kapsamlı Analiz Raporu

**Tarih:** Haziran 2026
**Site:** arvesta-france.com
**Sektör:** Mobilya, İç Dekorasyon, Menuiserie (Marangozluk)
**Hedef Pazar:** Fransa (birincil), Belçika, Almanya, Hollanda, Türkiye
**Teknoloji:** Next.js 15 App Router + Prisma + PostgreSQL + next-intl (fr/en/tr)

---

## 1. KRİTİK TEKNİK SORUNLAR (Öncelik Sırasıyla)

### 1.1 🔴 metadataBase URL Tutarsızlığı

**Etki:** Yüksek | **Zorluk:** Kolay | **Süre:** 15 dakika

`layout.tsx` dosyasında `metadataBase` olarak `https://arvestafrance.com` (tiresiz) kullanılıyor, ancak `seo.ts` ve `sitemap.ts` dosyalarında `https://arvesta-france.com` (tireli) kullanılıyor. Bu durum Google'ın canonical URL'leri yanlış yorumlamasına ve duplicate content sorunlarına yol açar.

**Düzeltme:**

```typescript
// layout.tsx — satır ~47
metadataBase: new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://arvesta-france.com", // tireli olmalı
),
```

### 1.2 🔴 Product Schema'da price: "0" Sorunu

**Etki:** Yüksek | **Zorluk:** Orta | **Süre:** 30 dakika

Özel yapım (sur mesure) ürünler için `price: "0"` kullanılıyor. Google bu durumda Offer schema'yı geçersiz sayar ve Rich Results göstermez. Ayrıca "ücretsiz ürün" olarak yanlış yorumlanabilir.

**Düzeltme — seo.ts productJsonLd fonksiyonu:**

```typescript
export function productJsonLd(
  locale: string,
  product: {
    name: string;
    description: string;
    slug: string;
    image?: string;
    category?: string;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${BASE_URL}/${locale}/products/${product.slug}`,
    ...(product.image ? { image: product.image } : {}),
    ...(product.category ? { category: product.category } : {}),
    brand: {
      "@type": "Brand",
      name: "Arvesta",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
    },
    // Offer kaldırıldı — sur mesure ürünlerde fiyat belirtmek yerine
    // sadece Product schema kullanmak Google'ın önerisidir.
    // Fiyat bilgisi olmayan ürünlerde Offer eklenmemeli.
  };
}
```

### 1.3 🔴 Organization Schema'da Logo Path Yanlış

**Etki:** Orta | **Zorluk:** Kolay | **Süre:** 5 dakika

`organizationJsonLd()` ve `furnitureStoreJsonLd()` fonksiyonlarında logo path'i `/uploads/products/logo.png` olarak belirtilmiş. Ancak gerçek logo dosyası `/logo.png` konumunda (public klasöründe). Bu durum Google'ın logo'yu bulamayıp Organization Knowledge Panel'de gösterememesine neden olur.

**Düzeltme — seo.ts:**

```typescript
logo: `${BASE_URL}/logo.png`,  // /uploads/products/logo.png değil
```

### 1.4 🔴 WebSite SearchAction Yanıltıcı

**Etki:** Orta | **Zorluk:** Orta | **Süre:** 20 dakika

`websiteJsonLd()` fonksiyonunda SearchAction URL template'i `/fr/collections/{search_term_string}` olarak tanımlanmış. Ancak sitede gerçek bir arama sayfası yok — collections sayfası bir arama sonuç sayfası değil. Google bu schema'yı yanıltıcı bulabilir ve manual action uygulayabilir.

**İki seçenek:**

1. Site içi arama yoksa SearchAction'ı tamamen kaldır
2. Gerçek bir arama sayfası oluştur (`/[locale]/search?q=...`)

**Önerilen düzeltme (SearchAction kaldırma):**

```typescript
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Arvesta Menuiserie France",
    url: BASE_URL,
    inLanguage: ["fr", "en", "tr"],
    // SearchAction kaldırıldı — gerçek arama sayfası oluşturulunca eklenecek
  };
}
```

### 1.5 🟡 Sitemap'te Eksik Sayfalar

**Etki:** Orta | **Zorluk:** Kolay | **Süre:** 15 dakika

Sitemap'te şu sayfalar eksik:

- `/services` — Hizmetler sayfası
- `/products` — Ürünler ana sayfası
- `/catalog/[slug]` — Dijital katalog sayfaları

**Düzeltme — sitemap.ts staticPages array'i:**

```typescript
const staticPages = [
  "",
  "/about",
  "/privacy",
  "/faq",
  "/blog",
  "/services",
  "/products",
];
```

Ayrıca catalog sayfaları için dinamik ekleme:

```typescript
// Sitemap fonksiyonu içinde, blogPosts sorgusu yanına ekle:
let catalogs: Array<{ slug: string; updatedAt: Date | null; createdAt: Date }> =
  [];
// prisma.digitalCatalog.findMany({ where: { published: true }, ... })

const catalogPages: MetadataRoute.Sitemap = catalogs.flatMap((catalog) =>
  LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}/catalog/${catalog.slug}`,
    lastModified: catalog.updatedAt ?? catalog.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    alternates: alternates(`/catalog/${catalog.slug}`),
  })),
);
```

### 1.6 🟡 Security Headers Eksik

**Etki:** Orta | **Zorluk:** Orta | **Süre:** 30 dakika

`next.config.ts`'te güvenlik header'ları eksik. Google, güvenli siteleri sıralamada tercih eder (E-E-A-T Trustworthiness sinyali).

**Düzeltme — next.config.ts headers() fonksiyonuna ekle:**

```typescript
{
  source: "/(.*)",
  headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-XSS-Protection", value: "1; mode=block" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ],
},
```

### 1.7 🟡 Robots.txt Eksiklikleri

**Etki:** Düşük | **Zorluk:** Kolay | **Süre:** 10 dakika

Mevcut robots.txt'te Googlebot-Image için özel kural yok ve crawl-delay belirtilmemiş.

**Düzeltme — robots.ts:**

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/uploads/", "/logo.png", "/image.png"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

### 1.8 🟡 404 Sayfası Sadece Fransızca

**Etki:** Düşük | **Zorluk:** Kolay | **Süre:** 15 dakika

`not-found.tsx` sayfası hardcoded Fransızca metin içeriyor. Çok dilli bir site için bu, İngilizce ve Türkçe kullanıcılar için kötü bir deneyim. i18n çevirilerini kullanmalı.

### 1.9 🟡 Privacy Sayfasında OpenGraph Eksik

**Etki:** Düşük | **Zorluk:** Kolay | **Süre:** 5 dakika

Privacy sayfasında `generateOgMeta()` çağrılmıyor. Sosyal medya paylaşımlarında eksik görünüm.

---

## 2. SCHEMA MARKUP İYİLEŞTİRME PLANI

### 2.1 Mevcut Schema Durumu

| Sayfa           | Mevcut Schema                    | Durum                      |
| --------------- | -------------------------------- | -------------------------- |
| Ana sayfa       | FurnitureStore + Organization    | ✅ İyi (logo düzeltilmeli) |
| Ürün detay      | Product + Offer + BreadcrumbList | ⚠️ Offer kaldırılmalı      |
| Koleksiyon      | CollectionPage + BreadcrumbList  | ✅ İyi                     |
| Blog detay      | Article + BreadcrumbList         | ✅ İyi (logo düzeltilmeli) |
| Blog listesi    | BreadcrumbList                   | ⚠️ Blog schema eksik       |
| FAQ             | FAQPage + BreadcrumbList         | ✅ İyi                     |
| Hakkımızda      | BreadcrumbList                   | ⚠️ AboutPage schema eksik  |
| Hizmetler       | BreadcrumbList                   | ⚠️ Service schema eksik    |
| Ürünler listesi | BreadcrumbList                   | ⚠️ ItemList schema eksik   |
| Katalog         | BreadcrumbList                   | ✅ Yeterli                 |
| Gizlilik        | —                                | ⚠️ BreadcrumbList eksik    |

### 2.2 Eksik Schema'lar ve Kod Örnekleri

#### A) Services Sayfası — Service Schema

**Etki:** Yüksek (GEO için kritik) | **Zorluk:** Orta | **Süre:** 30 dakika

```typescript
// seo.ts'e eklenecek
export function serviceJsonLd(
  services: Array<{ name: string; description: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: "Arvesta Menuiserie France",
    url: BASE_URL,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((svc) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: svc.name,
          description: svc.description,
          provider: {
            "@type": "Organization",
            name: "Arvesta Menuiserie France",
          },
          areaServed: [
            { "@type": "Country", name: "France" },
            { "@type": "Country", name: "Belgium" },
            { "@type": "Country", name: "Germany" },
            { "@type": "Country", name: "Netherlands" },
          ],
        },
      })),
    },
  };
}
```

#### B) About Sayfası — AboutPage Schema

**Etki:** Orta (E-E-A-T sinyali) | **Zorluk:** Kolay | **Süre:** 15 dakika

```typescript
// seo.ts'e eklenecek
export function aboutPageJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "À Propos — Arvesta Menuiserie France",
    url: `${BASE_URL}/${locale}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
      url: BASE_URL,
      foundingLocation: {
        "@type": "Place",
        name: "Aksaray, Türkiye",
      },
      areaServed: [
        { "@type": "Country", name: "France" },
        { "@type": "Country", name: "Belgium" },
        { "@type": "Country", name: "Germany" },
        { "@type": "Country", name: "Netherlands" },
      ],
      knowsAbout: [
        "Menuiserie sur mesure",
        "Cuisine sur mesure",
        "Mobilier premium",
        "Dressing sur mesure",
      ],
    },
  };
}
```

#### C) Blog Listesi — Blog Schema

**Etki:** Orta | **Zorluk:** Kolay | **Süre:** 15 dakika

```typescript
// seo.ts'e eklenecek
export function blogListJsonLd(
  locale: string,
  posts: Array<{ title: string; url: string; date: string; excerpt?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog & Inspirations — Arvesta",
    url: `${BASE_URL}/${locale}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Arvesta Menuiserie France",
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: post.url,
      datePublished: post.date,
      ...(post.excerpt ? { description: post.excerpt } : {}),
      author: {
        "@type": "Organization",
        name: "Arvesta Menuiserie France",
      },
    })),
  };
}
```

#### D) Ürünler Listesi — ItemList Schema

**Etki:** Orta | **Zorluk:** Kolay | **Süre:** 15 dakika

```typescript
// seo.ts'e eklenecek
export function productListJsonLd(
  locale: string,
  products: Array<{ name: string; url: string; image?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nos Produits — Arvesta",
    url: `${BASE_URL}/${locale}/products`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: p.url,
      ...(p.image ? { image: p.image } : {}),
    })),
  };
}
```

#### E) LocalBusiness Schema (FurnitureStore Genişletme)

**Etki:** Yüksek (Yerel SEO) | **Zorluk:** Orta | **Süre:** 20 dakika

Mevcut FurnitureStore schema'sına eklenmesi gereken alanlar:

```typescript
// furnitureStoreJsonLd fonksiyonuna eklenecek alanlar:
{
  // ... mevcut alanlar ...
  telephone: "+33-XXX-XXX-XXX", // Gerçek telefon numarası
  email: "contact@arvesta-france.com",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
  currenciesAccepted: "EUR",
  sameAs: [
    "https://instagram.com/arvesta",
    "https://www.facebook.com/arvesta", // Varsa
    "https://www.linkedin.com/company/arvesta", // Varsa
    "https://www.pinterest.fr/arvesta", // Varsa
  ],
}
```

---

## 3. İÇERİK YAPISI VE HEADER HİYERARŞİSİ ÖNERİLERİ

### 3.1 Sayfa Bazında H1-H6 Analizi

| Sayfa        | H1                         | H2                                             | H3+                      | Durum                                            |
| ------------ | -------------------------- | ---------------------------------------------- | ------------------------ | ------------------------------------------------ |
| Ana sayfa    | Hero slide title (dinamik) | Collections, Showcase, Export bölüm başlıkları | ✅                       | ⚠️ H1 dinamik, SEO açısından sabit bir H1 olmalı |
| Koleksiyon   | Kategori adı ✅            | —                                              | Ürün adları h3 ✅        | ✅ İyi                                           |
| Ürün detay   | Ürün adı ✅                | "Related Products" ✅                          | İlgili ürün adları h3 ✅ | ✅ İyi                                           |
| Blog listesi | Blog başlığı ✅            | Post başlıkları h2 ✅                          | —                        | ✅ İyi                                           |
| Blog detay   | Post başlığı ✅            | CTA başlığı h2 ✅                              | —                        | ✅ İyi                                           |
| FAQ          | FAQ başlığı ✅             | CTA başlığı h2 ✅                              | —                        | ✅ İyi                                           |
| Hakkımızda   | Hero başlığı ✅            | Story, Process, Craft, Team, CTA h2 ✅         | Process adımları h3 ✅   | ✅ İyi                                           |
| Hizmetler    | Hizmetler başlığı ✅       | CTA + FAQ h2 ✅                                | —                        | ✅ İyi                                           |
| Ürünler      | Ürünler başlığı ✅         | CTA h2 ✅                                      | —                        | ✅ İyi                                           |
| Gizlilik     | Gizlilik başlığı ✅        | Bölüm başlıkları h2 ✅                         | —                        | ✅ İyi                                           |

### 3.2 Ana Sayfa H1 Sorunu ve Çözümü

**Etki:** Yüksek | **Zorluk:** Orta | **Süre:** 20 dakika

Ana sayfada H1, Hero slider'ın dinamik başlığından geliyor. Bu, SEO açısından sorunlu çünkü:

- H1 her slide değişiminde değişiyor
- Google ilk render'daki H1'i alır ama tutarsızlık riski var
- Anahtar kelime hedeflemesi zayıf

**Öneri:** Hero bileşeninin üstüne veya içine sabit, SEO-optimize bir H1 ekle:

```tsx
// Ana sayfa page.tsx'e, Hero'dan önce:
<h1 className="sr-only">
  {locale === "fr"
    ? "Arvesta — Mobilier Sur Mesure Premium, Cuisines et Dressings"
    : locale === "en"
      ? "Arvesta — Premium Custom Furniture, Kitchens and Wardrobes"
      : "Arvesta — Premium Özel Tasarım Mobilya, Mutfak ve Gardırop"}
</h1>
```

Bu `sr-only` ile görsel olarak gizlenir ama arama motorları tarafından okunur.

### 3.3 Semantic HTML İyileştirmeleri

**Footer'da `<h4>` kullanımı:** Footer'da `<h4>` tag'leri kullanılıyor ama öncesinde `<h3>` yok. Bu, header hiyerarşisini bozar. Footer başlıkları için `<h4>` yerine `<span>` veya `<p>` kullanılmalı, çünkü footer navigasyon amaçlıdır, içerik hiyerarşisi değil.

**Catalog sayfasında hardcoded Türkçe:** `breadcrumbJsonLd` içinde `"Ürünlerimiz"` hardcoded. Bu, locale'e göre çevrilmeli.

---

## 4. FRANSA PAZARI ÖZEL STRATEJİSİ

### 4.1 Pazar Büyüklüğü ve Fırsat

Fransa mobilya pazarı yaklaşık 18-19.5 milyar USD değerinde ve 2026-2031 döneminde yıllık %6.08 CAGR ile büyümesi bekleniyor ([Ken Research](https://kenresearch.com/france-furniture-manufacturing-and-retail-market)). Sürdürülebilirlik, kentleşme ve ev geliştirme harcamalarındaki artış ana büyüme dinamikleri.

### 4.2 Fransızca Anahtar Kelime Stratejisi (Güncellenmiş)

**Birincil Hedefler (Yüksek Hacim):**
| Anahtar Kelime | Tahmini Hacim | Sayfa Hedefi |
|----------------|---------------|--------------|
| cuisine sur mesure | Yüksek | Koleksiyon: Cuisines |
| mobilier sur mesure | Yüksek | Ana sayfa + Ürünler |
| dressing sur mesure | Orta | Koleksiyon: Dressings |
| salle de bain sur mesure | Orta | Koleksiyon: Salles de Bains |
| menuiserie sur mesure | Orta | Hizmetler |
| aménagement intérieur | Yüksek | Blog içerikleri |
| cuisine haut de gamme | Orta | Koleksiyon: Cuisines |

**Long-Tail Hedefler (Düşük Rekabet, Yüksek Dönüşüm):**

- "cuisine sur mesure livraison Europe" → Hizmetler sayfası
- "mobilier artisanal turc qualité française" → Hakkımızda
- "dressing sur mesure Paris prix" → Koleksiyon + Blog
- "menuiserie haut de gamme livraison France" → Hizmetler
- "meuble cuisine moderne sur mesure" → Blog
- "aménagement salle de bain luxe" → Koleksiyon
- "fabricant mobilier turc pour Europe" → Hakkımızda (GEO hedefi)
- "cuisine sur mesure pas cher qualité" → Blog karşılaştırma yazısı

**Yerel SEO Hedefleri:**

- "menuiserie Paris" / "menuiserie Île-de-France"
- "cuisine sur mesure Lyon" / "cuisine sur mesure Marseille"
- "ébéniste Paris" / "artisan menuisier Paris"

### 4.3 Backlink ve Yerel SEO Stratejisi

**Ücretsiz Dizin Kayıtları (Öncelik Sırasıyla):**

1. Google Business Profile — Paris lokasyonu ile oluştur, fotoğraflar ekle
2. Pages Jaunes (pagesjaunes.fr) — Fransa'nın en büyük iş dizini
3. Houzz France (houzz.fr) — Mobilya/dekorasyon sektörü için kritik
4. Bing Places — Bing'de görünürlük
5. Yelp France — Müşteri yorumları için
6. Kompass France — B2B dizini
7. Europages — Avrupa geneli B2B dizini

**Sosyal Medya Profilleri (Backlink + Marka Sinyali):**

- Instagram (mevcut ✅) — Mobilya görselleri için ideal
- Pinterest France — Dekorasyon ilham panoları, yüksek trafik potansiyeli
- LinkedIn — B2B müşteriler ve profesyonel ağ
- Facebook — Fransa'da hâlâ güçlü kullanıcı tabanı

**Sektör Dizinleri ve PR:**

- Maison & Travaux — Ev dekorasyon dergisi
- Côté Maison — İç mekan tasarım platformu
- Houzz Pro — Profesyonel profil
- Archiexpo — Mimarlık ürünleri platformu

### 4.4 RGPD (GDPR) Uyumluluğu

Mevcut durum:

- Cookie consent banner ✅ (CookieConsent.tsx)
- Privacy policy sayfası ✅
- localStorage kullanımı ✅ (cookie yerine)

Eksikler:

- Cookie consent'te "Personnaliser" (özelleştir) seçeneği yok — CNIL (Fransa veri koruma otoritesi) bunu zorunlu kılıyor
- Analytics script'i consent olmadan yüklenebilir — consent "accepted" olmadan GA yüklenmemeli
- Privacy policy'de CNIL'e şikayet hakkı belirtilmeli

---

## 5. AVRUPA GENELİ ULUSLARARASI SEO PLANI

### 5.1 Hreflang Analizi

**Mevcut Durum:** ✅ İyi

- 3 locale: fr, en, tr
- x-default → fr (doğru)
- Bidirectional hreflang cluster'ları mevcut
- Sitemap'te hreflang alternates mevcut

**Eksikler ve Öneriler:**

#### A) Ülke Bazlı Locale Gereksinimi

Belçika (fr-BE), İsviçre (fr-CH) gibi Fransızca konuşan ülkeler için ek locale şu an gerekli değil çünkü:

- İçerik aynı Fransızca
- Fiyatlandırma EUR bazlı (Belçika ve Fransa aynı)
- Teslimat koşulları tüm Avrupa için aynı

Ancak gelecekte Almanca (de) locale eklemek Almanya ve İsviçre pazarı için değerli olabilir.

#### B) Subfolder Stratejisi ✅ Doğru

`arvesta-france.com/fr/`, `/en/`, `/tr/` yapısı uluslararası SEO için en iyi pratik. ccTLD (arvesta.fr, arvesta.de) veya subdomain (fr.arvesta.com) yerine subfolder tercih edilmiş — bu doğru çünkü:

- Domain authority tek domain'de toplanır
- Yönetim kolaylığı
- Hreflang implementasyonu daha basit

#### C) Google Search Console Uluslararası Hedefleme

- GSC'de "International Targeting" raporunu kontrol et
- Her locale için ayrı property oluşturmaya gerek yok (subfolder yapısında)
- Hreflang doğrulamasını GSC üzerinden yap

### 5.2 Almanca (de) Locale Ekleme Planı (Gelecek)

Almanya mobilya pazarı Avrupa'nın en büyüğü. Almanca locale eklemek:

- `routing.ts`'e `"de"` ekle
- Tüm çeviri dosyalarını oluştur
- Hreflang cluster'larını güncelle
- Sitemap'e de locale'ini ekle
- Almanca anahtar kelimeler: "Küche nach Maß", "Möbel nach Maß", "Einbauschrank nach Maß"

---

## 6. İÇ LİNKLEME MATRİSİ VE SİLO YAPISI

### 6.1 Mevcut İç Linkleme Durumu

**Footer Linkleri (mevcut):**

- Koleksiyonlar → Her kategori sayfası ✅
- Şirket → About, Contact, Privacy, FAQ, Blog ✅

**Navbar Linkleri (mevcut):**

- Home, About, Products, Services, Blog, Contact ✅

**Sayfa İçi Cross-Linking:**

- Ürün detay → İlgili ürünler (aynı alt kategori) ✅
- Ürün detay → Breadcrumb (Kategori → Ürün) ✅
- Blog detay → CTA (iletişim formu) ✅

### 6.2 Önerilen Silo Yapısı

```
Ana Sayfa (/)
├── Koleksiyonlar Silo
│   ├── /collections/cuisines
│   │   ├── /products/cuisine-moderne
│   │   ├── /products/cuisine-classique
│   │   └── /blog/comment-choisir-cuisine (cross-link)
│   ├── /collections/dressings
│   │   ├── /products/dressing-luxe
│   │   └── /blog/guide-dressing-sur-mesure (cross-link)
│   └── /collections/salles-de-bains
│       ├── /products/salle-de-bain-moderne
│       └── /blog/tendances-salle-de-bain (cross-link)
├── Hizmetler Silo
│   ├── /services (ana hizmetler)
│   │   ├── → /collections/cuisines (ilgili koleksiyon)
│   │   ├── → /collections/dressings (ilgili koleksiyon)
│   │   └── → /faq (SSS cross-link)
│   └── /faq
├── Blog Silo
│   ├── /blog (liste)
│   │   ├── /blog/comment-choisir-cuisine → /collections/cuisines
│   │   ├── /blog/tendances-2026 → /products/... (ilgili ürünler)
│   │   └── /blog/guide-dressing → /collections/dressings
│   └── Her blog yazısı → İlgili koleksiyon + ürün linkleri
└── Kurumsal Silo
    ├── /about → /services, /collections
    └── /privacy
```

### 6.3 Eksik Cross-Link Fırsatları

| Kaynak Sayfa  | Hedef Sayfa              | Link Türü               | Öncelik |
| ------------- | ------------------------ | ----------------------- | ------- |
| Blog yazıları | İlgili koleksiyon        | İçerik içi link         | Yüksek  |
| Blog yazıları | İlgili ürünler           | İçerik içi link         | Yüksek  |
| Hizmetler     | İlgili koleksiyonlar     | CTA butonu              | Yüksek  |
| Koleksiyon    | İlgili blog yazıları     | "İlham Alın" bölümü     | Orta    |
| Ürün detay    | İlgili hizmetler         | "Nasıl Sipariş Verilir" | Orta    |
| FAQ           | İlgili hizmetler/ürünler | Cevap içi link          | Orta    |
| About         | Koleksiyonlar            | "Çalışmalarımız" bölümü | Düşük   |

### 6.4 Footer İyileştirme Önerileri

Mevcut footer'a eklenecekler:

- **Hizmetler** linki (şu an eksik)
- **Ürünler** linki (şu an eksik)
- **Katalog** linki (dijital katalog varsa)
- Sosyal medya linkleri genişletilmeli (Pinterest, LinkedIn)

---

## 7. 2026 GÜNCEL TRENDLERE UYUM PLANI

### 7.1 AI Overview / SGE Optimizasyonu (GEO)

2026'da Google AI Overviews artık varsayılan arama deneyiminin bir parçası. AI referral trafiği 2025'in ilk yarısında %527 arttı ([Smart Business Revolution](https://smartbusinessrevolution.com/geo-search-optimization/)). GEO pazarı 2025'te 848 milyon dolar değerindeyken, 2034'te 33.7 milyar dolara ulaşması bekleniyor.

**Arvesta için GEO Stratejisi:**

1. **Soru-Cevap Formatında İçerik:** Her blog yazısı ve hizmet sayfası, AI'ın kolayca çıkarabileceği soru-cevap formatında bölümler içermeli.

2. **İstatistik ve Veri Kullanımı:** Blog yazılarında somut veriler kullanın:
   - "Özel yapım mutfak, standart mutfağa göre ortalama %30 daha uzun ömürlüdür"
   - "Fransa'da mobilya pazarı 2031'e kadar 23.16 milyar USD'ye ulaşacak"

3. **Uzman Alıntıları:** Ekip üyelerinden alıntılar ekleyin — AI sistemleri attributed quotes'u sever.

4. **Net Tanımlar:** Her teknik terimi açıkça tanımlayın:
   - "Menuiserie sur mesure: Müşterinin özel ölçü ve tasarım taleplerine göre üretilen mobilya ve doğrama işçiliği."

5. **Karşılaştırma Tabloları:** Ürün karşılaştırmaları, malzeme karşılaştırmaları — AI bu yapılandırılmış veriyi sever.

6. **"Last Updated" Timestamp:** Her sayfada güncelleme tarihi göster — AI güncel içeriği tercih eder.

### 7.2 E-E-A-T Sinyallerini Güçlendirme

**Experience (Deneyim):**

- Tamamlanmış proje case study'leri ekle (öncesi/sonrası fotoğrafları)
- Müşteri testimonial'ları (gerçek isim ve lokasyon ile)
- Üretim süreci videoları veya fotoğraf serileri

**Expertise (Uzmanlık):**

- Ekip üyelerinin uzmanlık alanlarını belirt (TeamMember schema'da)
- Blog yazılarında yazar bilgisi ekle (şu an sadece "Organization")
- Sertifika ve ödüller sayfası

**Authoritativeness (Otorite):**

- Sektör dizinlerinde profil oluştur (Houzz, Archiexpo)
- Basın bültenleri ve medya görünürlüğü
- Müşteri yorumları ve Google Reviews

**Trustworthiness (Güvenilirlik):**

- HTTPS ✅
- Şeffaf iletişim bilgileri ✅
- İade/garanti politikası sayfası ekle
- Güvenlik header'ları ekle (Bölüm 1.6)
- RGPD tam uyumluluk (Bölüm 4.4)

### 7.3 Core Web Vitals — INP Odağı

2026'da INP (Interaction to Next Paint) en kritik metrik. Arvesta'nın durumu:

**Potansiyel INP Sorunları:**

- `CustomCursor.tsx` — Mouse move event listener, her harekette state güncelliyor. `requestAnimationFrame` ile throttle edilmeli.
- `Preloader.tsx` — Sayfa yüklenirken animasyon, INP'yi etkilemez ama LCP'yi geciktirebilir.
- `CookieConsent.tsx` — localStorage okuma, useEffect içinde ✅ (non-blocking).
- Hero slider — Slide geçişlerinde ağır animasyonlar INP'yi etkileyebilir.

**Öneriler:**

- `will-change: transform` kullanımını minimize et (GPU bellek tüketimi)
- Lazy loading: Fold altındaki bileşenleri `dynamic(() => import(...), { ssr: false })` ile yükle
- Font yükleme: `display: swap` ✅ (zaten mevcut)
- Image optimization: Custom loader + sharp ✅ (zaten mevcut)

### 7.4 Structured Data ve AI Sistemleri

2026'da Google, Search Console'da bazı structured data türlerini basitleştirdi. Ancak structured data, AI sistemleri (ChatGPT, Perplexity, Gemini) tarafından da kullanılıyor.

**AI Sistemleri İçin Önemli Schema Türleri:**

- `FAQPage` ✅ — AI soru-cevap formatını sever
- `Product` ✅ — Ürün bilgisi çıkarımı
- `Organization` ✅ — Marka bilgisi
- `Article` ✅ — Blog içeriği
- `Service` ⚠️ — Eksik, eklenmeli
- `Review/AggregateRating` ⚠️ — Gelecekte eklenecek

**llms.txt Dosyası (Yeni Trend):**
AI crawler'ları için `llms.txt` dosyası oluşturmak, sitenin AI sistemleri tarafından daha iyi anlaşılmasını sağlar:

```text
# Arvesta Menuiserie France
> Premium custom furniture manufacturer. Made in Turkey, delivered across Europe.

## About
Arvesta specializes in bespoke kitchens, wardrobes, bathrooms and living spaces.
Based in Aksaray, Turkey with delivery throughout France, Belgium, Germany and Netherlands.

## Services
- Custom kitchen design and manufacturing
- Bespoke wardrobe and dressing room solutions
- Bathroom furniture and fixtures
- Professional installation across Europe
- After-sales service and warranty

## Contact
Website: https://arvesta-france.com
Languages: French, English, Turkish
```

---

## 8. 30-60-90 GÜN AKSİYON PLANI

### İlk 30 Gün — Kritik Düzeltmeler ve Temel Kurulum

| #   | Aksiyon                                                      | Etki   | Zorluk | Süre |
| --- | ------------------------------------------------------------ | ------ | ------ | ---- |
| 1   | metadataBase URL düzelt (tireli)                             | Yüksek | Kolay  | 15dk |
| 2   | Product schema'dan Offer kaldır                              | Yüksek | Kolay  | 30dk |
| 3   | Organization/FurnitureStore logo path düzelt                 | Orta   | Kolay  | 5dk  |
| 4   | WebSite SearchAction kaldır veya arama sayfası oluştur       | Orta   | Orta   | 20dk |
| 5   | Sitemap'e eksik sayfaları ekle (services, products, catalog) | Orta   | Kolay  | 15dk |
| 6   | Security headers ekle (next.config.ts)                       | Orta   | Orta   | 30dk |
| 7   | Google Search Console kurulumu + sitemap submit              | Yüksek | Kolay  | 30dk |
| 8   | Bing Webmaster Tools kurulumu                                | Orta   | Kolay  | 15dk |
| 9   | Google Business Profile oluştur (Paris)                      | Yüksek | Kolay  | 45dk |
| 10  | Ana sayfaya sabit H1 ekle (sr-only)                          | Yüksek | Kolay  | 10dk |
| 11  | Blog article schema'da logo path düzelt                      | Düşük  | Kolay  | 5dk  |
| 12  | Privacy sayfasına OpenGraph ekle                             | Düşük  | Kolay  | 5dk  |
| 13  | Robots.txt'e Googlebot-Image kuralı ekle                     | Düşük  | Kolay  | 10dk |

### 30-60 Gün — Schema Zenginleştirme ve İçerik

| #   | Aksiyon                                                  | Etki   | Zorluk | Süre     |
| --- | -------------------------------------------------------- | ------ | ------ | -------- |
| 14  | Services sayfasına Service schema ekle                   | Yüksek | Orta   | 30dk     |
| 15  | About sayfasına AboutPage schema ekle                    | Orta   | Kolay  | 15dk     |
| 16  | Blog listesine Blog schema ekle                          | Orta   | Kolay  | 15dk     |
| 17  | Products listesine ItemList schema ekle                  | Orta   | Kolay  | 15dk     |
| 18  | FurnitureStore schema'yı genişlet (telefon, saat, ödeme) | Orta   | Kolay  | 20dk     |
| 19  | Footer'a Services ve Products linkleri ekle              | Orta   | Kolay  | 10dk     |
| 20  | Footer h4 → span dönüşümü (semantic düzeltme)            | Düşük  | Kolay  | 10dk     |
| 21  | Catalog breadcrumb'da hardcoded Türkçe düzelt            | Düşük  | Kolay  | 5dk      |
| 22  | 404 sayfasını çok dilli yap                              | Düşük  | Kolay  | 15dk     |
| 23  | Cookie consent'e "Personnaliser" seçeneği ekle (CNIL)    | Orta   | Orta   | 1-2 saat |
| 24  | Analytics'i consent'e bağla                              | Orta   | Orta   | 30dk     |
| 25  | İlk 3 blog yazısını yayınla (GEO optimize)               | Yüksek | Zor    | 3-5 gün  |
| 26  | llms.txt dosyası oluştur                                 | Düşük  | Kolay  | 15dk     |

### 60-90 Gün — Büyüme ve Optimizasyon

| #   | Aksiyon                                                   | Etki   | Zorluk | Süre     |
| --- | --------------------------------------------------------- | ------ | ------ | -------- |
| 27  | Backlink stratejisi başlat (dizin kayıtları)              | Yüksek | Orta   | Sürekli  |
| 28  | Pinterest France profili oluştur + pin'ler                | Orta   | Kolay  | 2-3 saat |
| 29  | Houzz France profili oluştur                              | Orta   | Kolay  | 1 saat   |
| 30  | Proje portföyü / case study sayfası ekle                  | Yüksek | Zor    | 1 hafta  |
| 31  | Müşteri yorumları sistemi ekle (AggregateRating schema)   | Yüksek | Zor    | 1 hafta  |
| 32  | Site içi arama sayfası oluştur + SearchAction schema      | Orta   | Orta   | 2-3 gün  |
| 33  | INP optimizasyonu (CustomCursor throttle, lazy loading)   | Orta   | Orta   | 1 gün    |
| 34  | Almanca (de) locale planlama                              | Orta   | Zor    | 2 hafta  |
| 35  | Blog içerik takvimi oluştur (aylık 2-4 yazı)              | Yüksek | Orta   | Sürekli  |
| 36  | İç linkleme audit ve cross-link ekleme                    | Orta   | Kolay  | 1 gün    |
| 37  | Core Web Vitals monitoring kurulumu (GSC + Lighthouse CI) | Orta   | Orta   | 2-3 saat |

---

## 9. TEKNİK İMPLEMENTASYON ÖNERİLERİ (Next.js Spesifik)

### 9.1 Öncelikli Kod Değişiklikleri Özeti

**Dosya: `src/app/layout.tsx`**

- `metadataBase` URL'ini `https://arvesta-france.com` olarak düzelt

**Dosya: `src/lib/seo.ts`**

- `organizationJsonLd()`: logo path → `/logo.png`
- `furnitureStoreJsonLd()`: logo path → `/logo.png`, ek alanlar ekle
- `productJsonLd()`: Offer bloğunu kaldır
- `websiteJsonLd()`: SearchAction kaldır, `inLanguage` ekle
- Yeni fonksiyonlar: `serviceJsonLd()`, `aboutPageJsonLd()`, `blogListJsonLd()`, `productListJsonLd()`

**Dosya: `src/app/sitemap.ts`**

- `staticPages` array'ine `/services` ve `/products` ekle
- Catalog sayfaları için dinamik ekleme

**Dosya: `src/app/robots.ts`**

- Googlebot-Image kuralı ekle
- `/_next/` disallow ekle

**Dosya: `next.config.ts`**

- Security headers ekle (tüm route'lar için)

**Dosya: `src/app/[locale]/page.tsx`**

- Sabit H1 ekle (sr-only)

**Dosya: `src/app/[locale]/services/page.tsx`**

- Service JSON-LD schema ekle

**Dosya: `src/app/[locale]/about/page.tsx`**

- AboutPage JSON-LD schema ekle

**Dosya: `src/app/[locale]/blog/page.tsx`**

- Blog JSON-LD schema ekle

**Dosya: `src/app/[locale]/products/page.tsx`**

- ItemList JSON-LD schema ekle

**Dosya: `src/app/[locale]/privacy/page.tsx`**

- `generateOgMeta()` ekle
- BreadcrumbList schema ekle

**Dosya: `src/app/[locale]/blog/[slug]/page.tsx`**

- Article schema'da logo path düzelt

**Dosya: `src/app/[locale]/catalog/[slug]/page.tsx`**

- Breadcrumb'da hardcoded "Ürünlerimiz" → locale çevirisi

**Dosya: `src/components/public/Footer.tsx`**

- `<h4>` → `<span>` dönüşümü
- Services ve Products linkleri ekle

**Yeni Dosya: `public/llms.txt`**

- AI crawler'ları için site özeti

### 9.2 Gelecek Sprint İçin Büyük Özellikler

1. **Site İçi Arama:** `/[locale]/search?q=...` sayfası + SearchAction schema
2. **Müşteri Yorumları:** Review model (Prisma) + AggregateRating schema
3. **Proje Portföyü:** Case study sayfaları + ImageGallery schema
4. **Almanca Locale:** `de` dil desteği + çeviriler
5. **Video İçerik:** VideoObject schema + YouTube entegrasyonu

---

## 10. GEO (Generative Engine Optimization) ÖZEL STRATEJİSİ

### 10.1 AI Tarafından Alıntılanma Stratejisi

Arvesta'nın AI sistemleri (ChatGPT, Perplexity, Claude, Gemini) tarafından alıntılanması için:

**İçerik Formatı:**

- Her blog yazısının ilk paragrafı, konuyu net şekilde tanımlayan bir "definition paragraph" olmalı
- Soru-cevap formatında bölümler (H2: "Qu'est-ce que la menuiserie sur mesure ?")
- Numaralı listeler ve adım adım rehberler
- Karşılaştırma tabloları (sur mesure vs standard, malzeme karşılaştırmaları)

**Veri ve İstatistik:**

- Orijinal veriler üretin (müşteri memnuniyet oranları, proje süreleri, malzeme dayanıklılık testleri)
- Kaynaklı istatistikler kullanın
- Infografikler oluşturun

**Otorite Sinyalleri:**

- Yazar bilgisi ekleyin (Person schema ile)
- Uzman alıntıları kullanın
- Sertifika ve ödülleri belirtin
- "Son güncelleme" tarihi her sayfada görünsün

### 10.2 Önerilen Blog İçerik Takvimi (GEO Optimize)

| Ay  | Konu                                                                           | Hedef Anahtar Kelime       | GEO Hedefi            |
| --- | ------------------------------------------------------------------------------ | -------------------------- | --------------------- |
| 1   | "Guide complet : Comment choisir sa cuisine sur mesure en 2026"                | cuisine sur mesure         | Tanım + rehber        |
| 1   | "Sur mesure vs standard : Comparatif détaillé du mobilier"                     | mobilier sur mesure        | Karşılaştırma tablosu |
| 2   | "Les tendances aménagement intérieur 2026 en France"                           | aménagement intérieur 2026 | İstatistik + trend    |
| 2   | "Guide du dressing sur mesure : Dimensions, matériaux et prix"                 | dressing sur mesure prix   | Veri + rehber         |
| 3   | "Menuiserie turque : Pourquoi la qualité artisanale d'Aksaray séduit l'Europe" | menuiserie turque qualité  | Hikaye + otorite      |
| 3   | "Salle de bain sur mesure : 10 erreurs à éviter"                               | salle de bain sur mesure   | Liste + uzman tavsiye |

---

## KAYNAKLAR

- [Google Search Central — SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search Central — Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [Google Search Central — Hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Schema.org — FurnitureStore](https://schema.org/FurnitureStore)
- [Schema.org — Product](https://schema.org/Product)
- [Next.js SEO Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Yoast — 2026 SEO Predictions](https://yoast.com/2026-seo-predictions-by-yoast-experts/)
- [Frase.io — GEO Complete Guide 2026](https://frase.io/blog/what-is-generative-engine-optimization-geo/)
- [Ken Research — France Furniture Market](https://kenresearch.com/france-furniture-manufacturing-and-retail-market)

_Content was rephrased for compliance with licensing restrictions._
