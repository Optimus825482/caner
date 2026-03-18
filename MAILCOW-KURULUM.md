# Mailcow Kurulum Rehberi — Hetzner Sunucu

> Domain: arvestafrance.com | Mail: mail.arvestafrance.com
> Mevcut: Docker Compose (Next.js port 3000 + PostgreSQL 16)
> Strateji: Host Nginx reverse proxy → Arvesta (3000) + Mailcow (8080/8443)

---

## Adım 1: DNS Kayıtları

Hetzner DNS veya domain sağlayıcı panelinden ekle. `SUNUCU_IP` yerine gerçek IP'yi yaz.

- [x] `mail.arvestafrance.com` → A kaydı → `SUNUCU_IP`
- [x] `arvestafrance.com` → MX kaydı → `mail.arvestafrance.com` (öncelik: 10)
- [x] `autodiscover.arvestafrance.com` → CNAME → `mail.arvestafrance.com`
- [x] `autoconfig.arvestafrance.com` → CNAME → `mail.arvestafrance.com`
- [x] `arvestafrance.com` → TXT (SPF) → `"v=spf1 ip4:SUNUCU_IP a mx ~all"`
- [x] `_dmarc.arvestafrance.com` → TXT → `"v=DMARC1; p=quarantine; rua=mailto:postmaster@arvestafrance.com"`
- [ ] Hetzner Cloud → Networking → Reverse DNS (PTR) → `mail.arvestafrance.com`
- [ ] DKIM kaydı → Adım 12'de Mailcow panelinden alınacak

---

## Adım 2: Sunucu Gereksinimleri Kontrol

```bash
ssh root@SUNUCU_IP
```

- [ ] RAM kontrol (min 6 GB önerilir, 4 GB ClamAV kapalı çalışır):

```bash
free -h
```

- [ ] Disk kontrol (min 20 GB boş, 50 GB önerilir):

```bash
df -h
```

- [ ] Gerekli paketleri kur:

```bash
apt update && apt install -y git openssl curl gawk coreutils grep jq
```

- [ ] Docker versiyonu kontrol (>= 24.0.0):

```bash
docker --version
```

- [ ] Docker Compose versiyonu kontrol (>= 2.0):

```bash
docker compose version
```

---

## Adım 3: Host Nginx Reverse Proxy Kur

- [ ] Nginx ve Certbot kur:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

---

## Adım 4: Mailcow İndir

- [ ] Repository'yi klonla:

```bash
cd /opt
git clone https://github.com/mailcow/mailcow-dockerized
cd mailcow-dockerized
```

- [ ] Yapılandırma oluştur (hostname: `mail.arvestafrance.com`, timezone: `Europe/Paris`):

```bash
./generate_config.sh
```

---

## Adım 5: mailcow.conf Port Ayarları

Mailcow'un portlarını localhost'a bağla (host Nginx proxy yapacak).

- [ ] Dosyayı aç:

```bash
nano /opt/mailcow-dockerized/mailcow.conf
```

- [ ] Şu değerleri bul ve değiştir:

```ini
HTTP_BIND=127.0.0.1
HTTP_PORT=8080
HTTPS_BIND=127.0.0.1
HTTPS_PORT=8443
```

> ⚠️ Port 8081, 9081 ve 65510 KULLANMA — Mailcow dahili olarak kullanıyor.

---

## Adım 6: Arvesta Docker Compose Güncelle

Arvesta'yı da localhost'a bağla ki dışarıdan doğrudan erişilemesin.

- [ ] `arvesta/docker-compose.yaml` dosyasında port satırını değiştir:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

- [ ] Arvesta container'ını yeniden başlat:

```bash
cd /path/to/arvesta
docker compose down && docker compose up -d
```

---

## Adım 7: Nginx Site Yapılandırmaları

### Arvesta

- [ ] Dosya oluştur:

```bash
nano /etc/nginx/sites-available/arvestafrance.com
```

- [ ] İçerik:

```nginx
server {
    listen 80;
    server_name arvestafrance.com www.arvestafrance.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Mailcow

- [ ] Dosya oluştur:

```bash
nano /etc/nginx/sites-available/mail.arvestafrance.com
```

- [ ] İçerik:

```nginx
server {
    listen 80;
    server_name mail.arvestafrance.com autodiscover.arvestafrance.com autoconfig.arvestafrance.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Siteleri Aktif Et

- [ ] Symlink oluştur ve default'u kaldır:

```bash
ln -s /etc/nginx/sites-available/arvestafrance.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/mail.arvestafrance.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

- [ ] Test ve başlat:

```bash
nginx -t
systemctl restart nginx
```

---

## Adım 8: SSL Sertifikaları (Let's Encrypt)

- [ ] Arvesta SSL:

```bash
certbot --nginx -d arvestafrance.com -d www.arvestafrance.com
```

- [ ] Mailcow SSL:

```bash
certbot --nginx -d mail.arvestafrance.com -d autodiscover.arvestafrance.com -d autoconfig.arvestafrance.com
```

---

## Adım 9: Mailcow Başlat

- [ ] Image'ları indir ve başlat:

```bash
cd /opt/mailcow-dockerized
docker compose pull
docker compose up -d
```

- [ ] Container'ların çalıştığını doğrula:

```bash
docker compose ps
```

---

## Adım 10: Firewall Ayarları

- [ ] Mail portlarını aç (UFW):

```bash
ufw allow 25/tcp    # SMTP
ufw allow 465/tcp   # SMTPS
ufw allow 587/tcp   # Submission
ufw allow 143/tcp   # IMAP
ufw allow 993/tcp   # IMAPS
ufw allow 110/tcp   # POP3 (opsiyonel)
ufw allow 995/tcp   # POP3S (opsiyonel)
ufw allow 4190/tcp  # Sieve
```

- [ ] Hetzner Cloud Firewall kullanıyorsan aynı portları oradan da aç

> ⚠️ Hetzner varsayılan olarak port 25'i blokluyor olabilir.
> Çalışmıyorsa: Hetzner destek'e "port 25 unblock" talebi aç.

---

## Adım 11: Admin Paneline Giriş

- [ ] Tarayıcıdan aç: `https://mail.arvestafrance.com`
- [ ] Giriş: kullanıcı `admin`, şifre `moohoo`
- [ ] **İLK İŞ: Şifreyi değiştir!**

---

## Adım 12: DKIM Kaydı Ekle

- [ ] Mailcow admin → Configuration → ARC/DKIM keys
- [ ] Domain seç: `arvestafrance.com`
- [ ] Key length: 2048 → Add
- [ ] Oluşan DKIM değerini kopyala
- [ ] DNS'e ekle:

```
dkim._domainkey.arvestafrance.com   TXT   "v=DKIM1; k=rsa; p=UZUN_KEY_BURAYA"
```

---

## Adım 13: Mail Kutuları Oluştur

- [ ] Admin → E-Mail → Mailboxes → Add mailbox
- [ ] `info@arvestafrance.com`
- [ ] `contact@arvestafrance.com`
- [ ] Diğer gerekli adresler...

---

## Adım 14: Test

- [ ] SMTP bağlantı testi:

```bash
openssl s_client -connect mail.arvestafrance.com:465
```

- [ ] SOGo webmail'den test maili gönder: `https://mail.arvestafrance.com/SOGo`
- [ ] https://www.mail-tester.com adresine test maili gönder (hedef: 9-10/10)
- [ ] Gmail/Outlook'a test maili gönder, spam'e düşmediğini doğrula

---

## Notlar & Bakım

- **RAM yetersizse**: `mailcow.conf`'ta `SKIP_CLAMD=y` → ClamAV kapatılır (~2 GB kazanç)
- **Güncelleme**: `cd /opt/mailcow-dockerized && ./update.sh`
- **Loglar**: `cd /opt/mailcow-dockerized && docker compose logs -f --tail=100`
- **Yedekleme**: `/opt/mailcow-dockerized/helper-scripts/backup_and_restore.sh backup all`
