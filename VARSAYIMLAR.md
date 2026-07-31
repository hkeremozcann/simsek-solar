# Şimşek Solar — Varsayımlar ve Kararlar

Bu dosya, spec'te açıkça belirtilmemiş veya belirsiz kalan noktalardaki tasarım kararlarını içerir.
Tüm varsayımlar tartışılabilir; değiştirmek için bu dosyayı güncelleyin.

---

## Veri Modeli

| Konu | Varsayım | Neden |
|---|---|---|
| `proje_kodu` üretimi | DB sequence: `SS-YYYY-NNNN` | İstemcide üretim yarış koşulu yaratır |
| `blok_asamalari.olcu_birimi` | Dizilim + Borulama → kollektör, diğerleri → blok | Excel'deki AB-AE sütun mantığı |
| Saha ilerlemesi | Aşağı yuvarlama (floor) | %99.6 → %99: tamamlandı izlenimi vermemek için |
| Montaj sorumlusu yok | Zorunlu değil (nullable) | Excel'de bazı projelerde T sütunu boş |
| `bedelsiz_mi` varsayılanı | false | Çoğunluk bedelli |
| Excel'deki renk bilgisi | "Tamamlandı" önerisi olarak kullanıcıya sorulur, otomatik işaretlenmez | Yeşil = her zaman tamamlandı anlamına gelmeyebilir |

## Ölçek Kararları

| Ölçüt | Değer | Kaynak |
|---|---|---|
| Hedef proje | 348 | Gerçek Excel dosyası |
| Hedef blok | 8.814 | Gerçek Excel dosyası |
| Hedef blok-aşama | ~44.070 | 8.814 × 5 |
| Hedef konut | 133.729 | Gerçek Excel dosyası |
| Sayfa boyutu (liste) | 50 | Performans / UX dengesi |
| MV yenileme | Her hareket sonrası + gece 02:00 | Canlı veri önemi yüksek |

## Performans Gereksinimleri

- Proje listesi (348 proje): < 2 saniye
- Blok matrisi (47 blokluk en büyük proje): < 1 saniye
- Analitik (23 grafik, MV'den): < 2 saniye
- Excel aktarımı (348 proje, 8.814 blok): < 60 saniye

## Excel Aktarımı

| Konu | Varsayım |
|---|---|
| Başlık satırı | Satır 1-2 birleştirilmiş; satır 2 asıl başlık |
| Formül hücreleri | `xlsx` kütüphanesi hesaplanmış değeri okur (ham formül değil) |
| Yeşil satır tespiti | `xlsx-js-style` ile hücre dolgu rengi okunur |
| Boş blok sayısı | Projeye 1 blok atanır, "eksik veri" rozeti eklenir |
| Benzer firma eşleme | Levenshtein mesafesi ≤ 2 → birleştirme önerisi |
| Tarih "YOK" → null | Regex ile `/^YOK\s*$/i` eşleşmesi |
| İl normalizasyonu | Büyük harf + trim + hardcoded 81 il listesiyle eşleme |

## Kullanıcı Deneyimi

| Konu | Karar |
|---|---|
| Excel görünümü | Varsayılan değil, "Excel görünümü" toggle ile açılır |
| Blok matrisi mobil | Yatay kaydırma + ilk sütun sticky. Alternatif: blok kartı görünümü |
| Toplu aşama işaretleme | Onay modalı gösterilir, etkilenecek blok listesi listelenir |
| Sıra kuralı aşımı | Yönetici gerekçe modal'ı, diğerleri için net hata mesajı |
| Çevrimdışı kuyruk | IndexedDB, bağlantı gelince otomatik sync, başarısız durumda "Tekrar dene" |

## Teknoloji

| Konu | Karar |
|---|---|
| Excel okuma | `xlsx` (SheetJS) — istemci tarafında |
| Fotoğraf sıkıştırma | `browser-image-compression` — 1600px, WebP |
| PWA | Vite PWA plugin |
| Çevrimdışı | `@tanstack/react-query` persist + IndexedDB fallback |
| PDF | Supabase Edge Function + Puppeteer (V2'de) |
| E-posta | Resend + Edge Function (V2'de) |
