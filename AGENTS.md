---
inclusion: always
---

# Project Steering — arvesta

Bu dosya sadece **proje-özel** kuralları içerir.
Genel kimlik, iletişim ve memory davranışları global dosyadan (`~/.pi/agent/AGENTS.md`) gelir.

## Tech/Structure (project-specific)

- Stack: Next.js 16 (App Router) + React 19 + TypeScript
- Paket yöneticisi: npm (`package-lock.json` mevcut)
- Uygulama kodu: `src/`
- API route örnekleri: `src/app/api/**`
- Veritabanı: Prisma (`prisma/schema.prisma`, `prisma/migrations`, `prisma/seed.ts`)

## Commands

- Dev server: `npm run dev` (port `3018`)
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Seed: `npm run seed`

## Repo Conventions

- Değişiklikten önce ilgili dosyaları mutlaka oku; nokta atışı düzenleme yap.
- Küçük/izole değişikliklerde minimum diff üret.
- Upload akışıyla ilgili işlerde `src/app/api/upload/route.ts` ve README’deki Sharp/TinyPNG notlarıyla uyumlu kal.
- Yeni script eklenirse `package.json` ve gerekli dokümantasyon (README ilgili bölüm) birlikte güncellensin.

## Scope Guard

- Bu dosyada global kuralları tekrar etme.
- Buraya sadece bu repoya özgü teknik gerçekler ve çalışma kuralları eklenir.
