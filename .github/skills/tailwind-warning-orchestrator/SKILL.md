---
name: tailwind-warning-orchestrator
description: Tailwind lint uyarılarını (suggestCanonicalClasses, no-inline-styles) büyük kod tabanlarında hızlı ve güvenli şekilde gidermek için orkestrasyon rehberi. Kullanım durumları: canonical class dönüşümü, inline style kaldırma, toplu Tailwind temizliği, admin/public bileşenlerinde sınıf normalizasyonu.
---

# Tailwind Warning Orchestrator

Bu skill, büyük kapsamlı Tailwind uyarı temizliği için güvenli bir uygulama akışı verir.

## Hedefler

- `suggestCanonicalClasses` uyarılarını kanonik sınıf biçimine çevirmek.
- `no-inline-styles` uyarılarını CSS class tabanlı yapıya taşımak.
- Davranışı değiştirmeden minimum diff ile temizlemek.

## Uygulama Akışı

1. Uyarı listesi dosya bazında kümelenir.
2. Kanonik dönüşümler toplu ve mekanik olarak uygulanır (`scripts/fix-canonical-tailwind.mjs`).
3. Inline style içeren alanlar için:
   - statik değerler className’e taşınır,
   - dinamik değerler CSS custom property (`--x`) + utility class yaklaşımıyla çözülür,
   - mümkünse mevcut global CSS (`globals.css`) içinde yardımcı sınıf eklenir.
   - tespit ve raporlama için `scripts/report-inline-styles.mjs` kullanılır.
4. Her dosya sonrası tip/lint hataları kontrol edilir.

## Scriptler

- `scripts/fix-canonical-tailwind.mjs`
  - Amaç: `suggestCanonicalClasses` tipi mekanik dönüşümleri toplu uygulamak.
  - Kapsam: `src`, `app`, `components`, `lib`, `hooks`, `types`.
  - Dry-run: `node .github/skills/tailwind-warning-orchestrator/scripts/fix-canonical-tailwind.mjs --dry-run`

- `scripts/report-inline-styles.mjs`
  - Amaç: `style={{ ... }}` kullanımlarını dosya/satır bazında raporlamak.
  - Çıktı: konsol özeti + `tailwind-inline-style-report.json`.

- `scripts/run-tailwind-cleanup.mjs`
  - Amaç: tek komutta canonical fix + inline style raporu çalıştırmak.
  - Kullanım: `node .github/skills/tailwind-warning-orchestrator/scripts/run-tailwind-cleanup.mjs`
  - Dry-run: `node .github/skills/tailwind-warning-orchestrator/scripts/run-tailwind-cleanup.mjs --dry-run`

## Kanonik Dönüşüm Kuralları

- `bg-[var(--token)]` → `bg-(--token)`
- `text-[var(--token)]` → `text-(--token)`
- `border-[var(--token)]/...` → `border-(--token)/...`
- `focus-visible:ring-[var(--token)]/...` → `focus-visible:ring-(--token)/...`
- `bg-gradient-to-*` → `bg-linear-to-*`
- `aspect-[a/b]` → `aspect-a/b`
- `z-[n]` → `z-n`
- `duration-[1500ms]` → `duration-1500`

## Inline Style Kaldırma Rehberi

- **Statik background-image SVG** gibi alanlarda `globals.css` içinde yardımcı sınıf üret.
- **Dinamik opacity/fontSize/transform** gibi alanlarda:
  - component üzerinde `data-*` ve/veya CSS variable ata,
  - stilleri sınıfa taşı,
  - doğrudan `style={{...}}` kullanımını kaldır.

## Güvenlik ve Stabilite

- JSX yapısını bozabilecek toplu replace sonrası dosya bütünlüğünü doğrula.
- Erişilebilirlik niteliği olan `aria-*`, `title`, `label` bağlarını koru.
- Görsel davranış değişikliği riski olan alanlarda sadece lint hedefli minimal değişiklik yap.

## Doğrulama

- Önce hedef dosyalar, sonra tüm proje için lint/errors çalıştır.
- Yeni TypeScript/JSX parse hatası oluşursa önce onu düzelt, sonra kalan uyarılara dön.
- Script sonrası önerilen sıra:
  1. `run-tailwind-cleanup.mjs`
  2. `npm run lint`
  3. parse/type hataları varsa önce onları temizle
