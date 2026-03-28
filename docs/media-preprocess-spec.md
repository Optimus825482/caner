# Media Preprocess Technical Spec (Self-hosted Sharp)

## Goal

Admin panelde yüklenen tüm görseller yayınlanmadan önce preprocess editöründen geçer.
Kaydet aksiyonu anında publish eder.

## Scope

- `/api/upload` kullanan tüm admin akışları
- Hero form
- Product form
- (sonraki adım) Categories image upload

## Workflow

1. Admin görsel seçer.
2. `POST /api/upload` çağrılır.
3. API dosyayı public yerine `storage/tmp-media` altına yazar ve `tempId + previewUrl` döner.
4. UI otomatik `MediaEditorDialog` açar.
5. Kullanıcı crop/rotate/quality/brightness/contrast/saturation/watermark/text overlay/auto-enhance ayarlarını yapar.
6. `POST /api/media/publish` çağrılır.
7. Sharp recipe ile final render alınır, `public/uploads/products` altına yazılır.
8. Form state published URL ile güncellenir.

## API Contracts

### POST /api/upload

Input: multipart form-data `file`
Output:

```json
{
  "tempId": "uuid",
  "previewUrl": "/api/media/temp/:id",
  "width": 1200,
  "height": 800,
  "format": ".jpg",
  "requiresPreprocess": true
}
```

### GET /api/media/temp/:id

- Admin auth + same-origin gerekir
- Temp dosyayı no-store ile döndürür

### POST /api/media/publish

Input:

```json
{
  "tempId": "uuid",
  "recipe": {
    "crop": { "x": 0, "y": 0, "width": 100, "height": 100 },
    "rotate": 0,
    "quality": 85,
    "brightness": 0,
    "contrast": 0,
    "saturation": 0,
    "autoEnhance": false,
    "watermark": {
      "enabled": false,
      "position": "bottom-right",
      "opacity": 0.7,
      "scale": 0.4
    },
    "textOverlays": []
  }
}
```

Output:

```json
{
  "url": "/uploads/products/....jpg",
  "filename": "...jpg",
  "published": true
}
```

## Security

- Magic-byte + MIME + extension eşleşmesi zorunlu
- Max size ve max dimension kontrolleri
- Admin auth + same-origin guard
- Temp preview endpoint public değil
- Temp cleanup (24h)

## Known Trade-offs

- Crop UI şu an input tabanlı (x/y/w/h yüzde). İkinci fazda drag-drop cropper eklenebilir.
- Text overlay live-preview minimal; final authority backend Sharp.

## Next Steps

- Categories admin sayfasına görsel upload alanı + editor entegrasyonu
- Temp cleanup için cron/scheduled job
- E2E testler (upload -> edit -> publish -> save)
