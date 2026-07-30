# Şimşek Solar — Kurulum Rehberi

## Ön Gereksinimler
- Node.js 18+
- Supabase hesabı (supabase.com — ücretsiz)

## 1. Supabase Projesi Oluşturun

1. [supabase.com](https://supabase.com) adresine gidin
2. "New Project" tıklayın
3. Proje adı: `simsek-solar`
4. Veritabanı şifresi belirleyin (kaydedin)
5. Bölge: `eu-central-1` (Frankfurt) — Türkiye'ye en yakın

## 2. Veritabanı Şemasını Kurun

1. Supabase Dashboard → **SQL Editor** → "New Query"
2. `supabase/migrations/001_initial_schema.sql` dosyasının tüm içeriğini yapıştırın
3. "Run" tıklayın — yaklaşık 2-3 saniye sürer

## 3. İlk Yönetici Kullanıcısını Ekleyin

Supabase Dashboard → **Authentication** → **Users** → "Invite user":
- E-posta: yonetici@simseksolar.com (veya gerçek e-posta)
- Kullanıcı daveti kabul edince aşağıdaki SQL'i çalıştırın:

```sql
-- Kullanıcı kaydını tamamlayın (Auth Users tablosundaki ID'yi kullanın)
INSERT INTO kullanicilar (id, ad_soyad, eposta, rol, aktif_mi)
VALUES (
  'AUTH_USER_ID_BURAYA',  -- Supabase Auth'taki UUID
  'Ad Soyad',
  'eposta@simseksolar.com',
  'yonetici',
  true
);
```

## 4. .env Dosyasını Oluşturun

```bash
cp .env.example .env
```

`.env` dosyasını açıp Supabase bilgilerini girin:
- **VITE_SUPABASE_URL**: Dashboard → Settings → API → Project URL
- **VITE_SUPABASE_ANON_KEY**: Dashboard → Settings → API → Project API Keys → anon/public

## 5. Uygulamayı Başlatın

```bash
npm install
npm run dev
```

Tarayıcıda: http://localhost:5173

## 6. İnternetten Erişim (Vercel)

```bash
npm install -g vercel
vercel
```

Vercel'e ortam değişkenlerini ekleyin:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Kullanıcı Rolleri

| Rol | Yetki |
|---|---|
| `yonetici` | Her şey — kullanıcı yönetimi, silme |
| `satis_sonrasi_sorumlusu` | Proje ekleme/düzenleme, aşama işaretleme |
| `saha_teknisyeni` | Sadece atanan projeler, aşama işaretleme |
| `satis_temsilcisi` | Görüntüleme + yorum |
| `bayi` | Sadece kendi projeleri |

## Notlar

- Saha raporu PDF ve e-posta (v2) henüz uygulanmadı
- Fotoğraf yükleme için Supabase Storage kurulumu gerekli (v2)
- Günlük yedekleme Supabase Pro planında otomatik
