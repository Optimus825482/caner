# Coolify Deploy

`docker-compose.yaml` Coolify tarafından parse edilir. Compose dosyasında referans edilen tüm env'leri **Coolify UI → Environment Variables** kısmında tanımla.

## Zorunlu (REQUIRED — compose fail eder)

| Key | Açıklama |
|---|---|
| `DB_PASSWORD` | Postgres user password. Güçlü rasgele string. |
| `AUTH_SECRET` | NextAuth secret. `openssl rand -base64 32` ile üret. |

## Veritabanı

DB compose içinde çalışıyor (`db` servisi). Coolify'ın external DB proxy ayarı **yok**. Volume `arvesta_postgres_data` host üzerinde yaşar.

**Backup**: `docker run --rm -v arvesta_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/db-$(date +%F).tar.gz /data`

## Opsiyonel ama önerilen

| Key | Default | Açıklama |
|---|---|---|
| `NEXTAUTH_URL` | `https://arvestafrance.com` | Production domain. |
| `NEXT_PUBLIC_SITE_URL` | `https://arvesta-france.com` | SEO/OG/JSON-LD canonical URL. |
| `NEXT_PUBLIC_GA_ID` | boş | Google Analytics 4 ID. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | boş | Cloudflare Turnstile site key. |
| `TURNSTILE_SECRET_KEY` | boş | Cloudflare Turnstile secret. |
| `NVIDIA_API_KEY` | boş | Qwen translation/generation. |
| `OPENROUTER_API_KEY` | boş | NVIDIA fallback. |
| `POSTGRES_DB` | `arvesta_db` | DB adı. |
| `POSTGRES_USER` | `postgres` | DB user. |

## Production'da boş OLMALI

| Key | Boş bırakılmazsa |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | Boş veya `"false"`. `"true"` olursa `/api/auth/demo-login` plaintext password döner. |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | Production'da boş. |

## Mailer

`SMTP_*` env'leri **yok**. Tüm mail ayarları admin panelden DB'ye (`siteSetting` tablosu) yazılır: SMTP host, port, user, pass, from, to.

## Build-time vs Runtime

`NEXT_PUBLIC_*` değişkenleri **build sırasında** JS bundle'a gömülür. Coolify'da env'yi değiştirdikten sonra **rebuild** gerekli, redeploy değil.

## Domain & Proxy

Coolify otomatik Traefik label'ları ekler. Compose'da `ports` kapalı (Coolify kendi yönetir). Coolify dışında çalıştırmak istersen `ports: - "${APP_PORT:-3000}:3000"` satırını aç.

## İlk deploy checklist

1. Coolify'da yeni `Docker Compose` resource oluştur
2. Repo bağla
3. `docker-compose.yaml` otomatik algılanır
4. Environment Variables yukarıdaki tabloya göre doldur
5. **Build Pack**: `Dockerfile` (default)
6. Domain ayarla (Cloudflare proxy arkasında — DNS only önerilir, ACME için)
7. Deploy → healthcheck yeşil olunca yayında
8. İlk çalıştırmada Prisma otomatik migrate eder (`docker-entrypoint.sh`)

## Volume backup stratejisi

`arvesta_postgres_data` ve `arvesta_uploads` named volume. Coolify scheduled backup destekliyorsa etkinleştir, yoksa cron ile:

```bash
0 3 * * * docker run --rm -v arvesta_postgres_data:/data -v /backups:/backup alpine tar czf /backup/db-$(date +\%F).tar.gz /data
0 4 * * * docker run --rm -v arvesta_uploads:/uploads -v /backups:/backup alpine tar czf /backup/uploads-$(date +\%F).tar.gz /uploads
```
