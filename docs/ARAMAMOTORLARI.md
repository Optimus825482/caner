# Arvesta SEO Stratejisi ve Arama Motoru Optimizasyonu Raporu

**Tarih:** Mart 2026
**Hedef Pazar:** Fransa ve Avrupa (FR, BE, DE, NL)
**Sektör:** Mobilya, İç Dekorasyon, Menuiserie (Marangozluk)
**Site:** arvesta-france.com

---

## 1. Mevcut Durum Analizi

### Güçlü Yanlar (Zaten Mevcut)

- Sitemap.xml dinamik olarak ürün ve kategorilerden üretiliyor
- Robots.txt doğru yapılandırılmış (/admin/ ve /api/ engellenmiş)
- Ana sayfa JSON-LD FurnitureStore schema'sı mevcut
- Her sayfa için locale bazlı generateMetadata fonksiyonları var
- OpenGraph ve Twitter Card meta tag'leri kısmen mevcut
- Google Analytics entegrasyonu hazır (NEXT_PUBLIC_GA_ID)
- PWA manifest.json düzgün yapılandırılmış
- 3 dil desteği (fr, en, tr) next-intl ile

### Kritik Eksiklikler (Düzeltildi)

1. **Hreflang tag'leri YOK** — Çok dilli siteler için en kritik SEO unsuru
2. **Canonical URL'ler YOK** — Duplicate content riski
3. **Ürün sayfalarında JSON-LD YOK** — Rich snippet'lar görünmüyor
4. **Koleksiyon sayfalarında JSON-LD YOK** — Kategori zengin sonuçları yok
5. **BreadcrumbList schema YOK** — Google breadcrumb snippet'ı gösteremiyor
6. **Organization schema YOK** — Marka bilgisi arama motorlarına iletilmiyor
7. **Sitemap'te about, privacy sayfaları YOK** — Eksik indexleme
8. **Open Graph locale alternates YOK** — Sosyal medya paylaşımlarında yanlış dil
9. **Admin panelinde SEO ayarları YOK** — Meta description yönetimi eksik
10. **Image alt text optimizasyonu eksik** — Görsel arama trafiği kaybı

---

## 2. Google'ın 2026 Güncel SEO Gereksinimleri

### 2.1 Core Web Vitals (Sayfa Deneyimi)

- **LCP (Largest Contentful Paint):** < 2.5 saniye
- **INP (Interaction to Next Paint):** < 200ms (FID yerine geçti)
- **CLS (Cumulative Layout Shift):** < 0.1
- Next.js SSR + Image optimization ile zaten iyi durumda

### 2.2 Mobile-First Indexing

- Google tamamen mobile-first indexing kullanıyor
- Responsive tasarım mevcut ✓
- Viewport meta tag mevcut ✓

### 2.3 Structured Data (Yapılandırılmış Veri)

- JSON-LD formatı Google tarafından tercih ediliyor
- FurnitureStore, Product, BreadcrumbList, Organization schema'ları gerekli
- Rich Results Test ile doğrulama yapılmalı

### 2.4 International SEO (Çok Dilli SEO)

- Hreflang tag'leri bidirectional olmalı (her dil diğerlerini referans etmeli)
- x-default hreflang gerekli (varsayılan dil için)
- Canonical URL'ler her locale için ayrı olmalı
- Sitemap'te hreflang alternates belirtilmeli

### 2.5 E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

- Hakkımızda sayfası detaylı olmalı ✓
- İletişim bilgileri açık olmalı ✓
- Gizlilik politikası mevcut ✓
- SSL/HTTPS zorunlu ✓

---

## 3. Hızlı İndexlenme Stratejisi

### 3.1 Google Search Console Kurulumu

1. Site sahipliğini doğrula (DNS TXT kaydı veya HTML dosyası)
2. Sitemap.xml'i GSC'ye submit et
3. URL Inspection Tool ile önemli sayfaları manuel indexlemeye gönder
4. International Targeting raporunu kontrol et

### 3.2 Crawl Budget Optimizasyonu

- Gereksiz sayfaları robots.txt ile engelle ✓
- Sitemap'i güncel tut (dinamik üretim mevcut) ✓
- 404 hatalarını minimize et
- Redirect zincirlerinden kaçın
- Server yanıt süresini < 200ms tut

### 3.3 İlk 30 Gün Aksiyon Planı

1. **Gün 1-3:** Google Search Console + Bing Webmaster Tools kurulumu
2. **Gün 1-3:** Sitemap submit + URL inspection ile ana sayfaları gönder
3. **Gün 4-7:** Google Business Profile oluştur (Paris lokasyonu)
4. **Gün 7-14:** Backlink stratejisi başlat (aşağıda detay)
5. **Gün 14-30:** İçerik stratejisi başlat

### 3.4 Backlink Stratejisi (Ücretsiz)

- **Dizin kayıtları:** Pages Jaunes, Houzz France, Yelp France
- **Sosyal profiller:** Instagram, Pinterest (mobilya görselleri için ideal), LinkedIn
- **Sektör dizinleri:** Maison & Travaux, Côté Maison dizinleri
- **Google Business Profile:** Mutlaka oluştur, fotoğraflar ekle
- **Bing Places:** Bing'de de görünürlük için kayıt ol

---

## 4. Fransa ve Avrupa İçin Anahtar Kelime Stratejisi

### 4.1 Birincil Anahtar Kelimeler (Fransızca)

| Anahtar Kelime           | Aylık Arama | Rekabet |
| ------------------------ | ----------- | ------- |
| cuisine sur mesure       | Yüksek      | Orta    |
| mobilier sur mesure      | Yüksek      | Orta    |
| dressing sur mesure      | Orta        | Düşük   |
| menuiserie sur mesure    | Orta        | Düşük   |
| meuble sur mesure Paris  | Orta        | Orta    |
| salle de bain sur mesure | Orta        | Orta    |
| aménagement intérieur    | Yüksek      | Yüksek  |
| cuisine haut de gamme    | Orta        | Orta    |
| mobilier premium         | Düşük       | Düşük   |

### 4.2 Long-Tail Anahtar Kelimeler

- "cuisine sur mesure livraison Europe"
- "mobilier artisanal turc qualité française"
- "dressing sur mesure Paris prix"
- "menuiserie haut de gamme livraison France"
- "meuble cuisine moderne sur mesure"
- "aménagement salle de bain luxe"

### 4.3 Yerel SEO Anahtar Kelimeleri

- "menuiserie Paris"
- "cuisine sur mesure Île-de-France"
- "mobilier sur mesure Lyon"
- "ébéniste Paris"

---

## 5. Yapılan Teknik SEO İyileştirmeleri

### 5.1 Hreflang ve Canonical URL'ler

- Tüm sayfalara hreflang alternates eklendi
- x-default hreflang Fransızca'ya yönlendiriliyor
- Canonical URL'ler her locale için doğru şekilde ayarlandı
- Bidirectional hreflang cluster'ları oluşturuldu

### 5.2 JSON-LD Structured Data

- **Ana sayfa:** FurnitureStore + Organization schema (genişletildi)
- **Ürün sayfaları:** Product + Offer + BreadcrumbList schema eklendi
- **Koleksiyon sayfaları:** CollectionPage + BreadcrumbList schema eklendi
- **Hakkımızda:** AboutPage schema eklendi
- **Tüm sayfalar:** WebSite schema root layout'a eklendi

### 5.3 Sitemap İyileştirmeleri

- About, privacy sayfaları sitemap'e eklendi
- Hreflang alternates sitemap'e eklendi (Google önerisi)
- lastModified tarihleri doğru şekilde ayarlandı

### 5.4 Meta Tag İyileştirmeleri

- OpenGraph locale alternates eklendi
- Canonical URL'ler tüm sayfalara eklendi
- Daha zengin meta description'lar (anahtar kelime optimizasyonu)
- Image alt text'leri iyileştirildi

### 5.5 Admin Panel SEO Sekmesi

- Admin ayarlarına "SEO" sekmesi eklendi
- Google Search Console doğrulama kodu alanı
- Bing Webmaster doğrulama kodu alanı
- Varsayılan meta description yönetimi
- Google Analytics ID yönetimi

---

## 6. İçerik Stratejisi Önerileri

### 6.1 Blog / Inspirasyon Sayfası ✅

Blog ve inspirasyon sayfası oluşturuldu:

- Admin panelinde CRUD yönetimi (liste + form sayfası)
- Çoklu dil desteği (fr, en, tr) — her yazı için ayrı çeviriler
- Görsel yükleme (MediaEditorDialog entegrasyonu)
- Public blog listesi ve detay sayfası
- Article + BreadcrumbList JSON-LD schema
- Hreflang ve canonical URL'ler
- Sitemap'e blog URL'leri eklendi
- Navbar ve Footer'a blog linki eklendi

### 6.2 FAQ Sayfası ✅

Google FAQ rich snippet'ları için 10 soru-cevap ile `/faq` sayfası oluşturuldu:

- FAQPage + BreadcrumbList JSON-LD schema
- 3 dilde tam çeviri (fr, en, tr)
- Navbar ve Footer'a link eklendi
- Native `<details>/<summary>` accordion (JS gerektirmez)
- CTA bölümü iletişim formuna yönlendiriyor

### 6.3 Proje Portföyü (Gelecek)

Tamamlanmış projelerin detaylı case study'leri:

- Öncesi/sonrası fotoğrafları
- Kullanılan malzemeler
- Müşteri yorumları

---

## 7. Performans ve Teknik Kontrol Listesi

- [x] SSL/HTTPS aktif
- [x] Mobile responsive tasarım
- [x] Sitemap.xml dinamik üretim
- [x] Robots.txt doğru yapılandırma
- [x] Hreflang tag'leri
- [x] Canonical URL'ler
- [x] JSON-LD structured data
- [x] OpenGraph meta tag'leri
- [x] Twitter Card meta tag'leri
- [x] Google Analytics entegrasyonu
- [x] Image optimization (sharp + custom loader)
- [x] Font optimization (display: swap)
- [x] Admin SEO ayarları
- [ ] Google Search Console kurulumu (manuel)
- [ ] Bing Webmaster Tools kurulumu (manuel)
- [ ] Google Business Profile oluşturma (manuel)
- [x] Blog/içerik sayfası ekleme (admin CRUD, çoklu dil, görsel yükleme, Article JSON-LD)
- [x] FAQ sayfası ekleme (10 soru-cevap, FAQPage JSON-LD, navbar + footer linkleri)

---

## 8. Kaynaklar

- [Google Search Central - SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [Google Search Central - Hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Schema.org - FurnitureStore](https://schema.org/FurnitureStore)
- [Schema.org - Product](https://schema.org/Product)
- [Next.js SEO Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

_Content was rephrased for compliance with licensing restrictions._
