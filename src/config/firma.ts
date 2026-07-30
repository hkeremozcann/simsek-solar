// Şimşek Solar — Tek yerden değiştirilebilir firma ayarları
// VARSAYIMLAR.md ile senkron tutulur

export const FIRMA_AYARLARI = {
  ad: 'Şimşek Solar',
  adres: 'Organize Sanayi Bölgesi, Gaziantep',
  telefon: '0342 XXX XX XX',
  eposta: 'info@simseksolar.com.tr',
  saha_raporu_epostasi: 'saharaporu@simseksolar.com.tr',
  vergi_dairesi: 'Şahinbey VD',
  vergi_no: '123 456 7890',
  web: 'www.simseksolar.com.tr',
  logo_url: '/logo.svg',
} as const

// SLA: Hata şiddetine göre varsayılan kapatma süresi (gün)
export const HATA_SLA_GUN: Record<string, number> = {
  Kritik: 3,
  Majör: 7,
  Minör: 15,
}

// Durgunluk eşiği (gün)
export const HAREKETSIZLIK_ESIGI_GUN = 30

// Liste sayfası başına kayıt
export const SAYFA_BOYUTU = 50

// Fotoğraf maksimum genişlik (px) — sıkıştırma için
export const FOTO_MAX_GENISLIK = 1600

// Proje kodu formatı
export const PROJE_KODU_PREFIX = 'SS'
