// Şimşek Solar — Tip Tanımları

export type KurumTipi =
  | 'TOKİ'
  | 'Sağlık Bakanlığı'
  | 'Adalet Bakanlığı'
  | 'Gençlik ve Spor Bakanlığı'
  | 'MEB'
  | 'Belediye'
  | 'Özel Sektör'
  | 'Diğer'

export type KullaniciRolu =
  | 'yonetici'
  | 'satis_sonrasi_sorumlusu'
  | 'saha_teknisyeni'
  | 'satis_temsilcisi'
  | 'bayi'

export type ProjeKapsami =
  | 'Malzeme Satışı'
  | 'Panel Dizilim Montajı'
  | 'Borulama Montajı'
  | 'Pano Montajı'
  | 'Devreye Alma'
  | 'Proje Desteği'

export type SistemTipi =
  | 'Açık Devre'
  | 'Kapalı Devre'
  | 'Basınçlı'
  | 'Basınçsız'
  | 'Merkezi Sistem'

export type ProjeDurumu = 'Çalışıyor' | 'Beklemede' | 'Tamamlandı' | 'İptal'

export type AsamaDurumu = 'Başlamadı' | 'Devam Ediyor' | 'Tamamlandı'

export type AsamaSonucu = 'Uygun' | 'Hatalı'

export type AsamaTipi =
  | 'Kaide Kontrolü'
  | 'Dizilim'
  | 'Borulama'
  | 'Pano Bağlantısı'
  | 'Devreye Alma'

export type DokumanTipi =
  | 'Kaide Projesi'
  | 'Borulama Projesi'
  | 'Uygulama Projesi'

export type DokumanDurumu =
  | 'Başlamadı'
  | 'Hazırlanıyor'
  | 'Müşteriye Gönderildi'
  | 'Revizyon İstendi'
  | 'Onaylandı'

export type RaporTipi =
  | 'İlk Keşif'
  | 'Ara Kontrol'
  | 'Kaide Kontrol'
  | 'Montaj Kontrol'
  | 'Devreye Alma'
  | 'Arıza/Servis'
  | 'Kesin Teslim'

export type GonderimDurumu = 'Başarılı' | 'Hatalı'

export type AliciTipi = 'Kime' | 'Bilgi'

export type SantiyeYetkilisisiGorevi =
  | 'Şantiye Şefi'
  | 'Kontrol Amiri'
  | 'Teknik Ofis'
  | 'Taşeron Yetkilisi'

// ─── Veritabanı Satır Tipleri ────────────────────────────────────────────────

export interface Firma {
  id: string
  ad: string
  kurum_tipi: KurumTipi
  ana_yuklenici?: string
  vergi_dairesi?: string
  vergi_no?: string
  adres?: string
  il?: string
  ilce?: string
  telefon?: string
  genel_eposta?: string
  notlar?: string
  olusturma_tarihi: string
  guncelleme_tarihi: string
}

export interface Bayi {
  id: string
  ad: string
  yetkili_kisi?: string
  telefon?: string
  eposta?: string
  il?: string
  aktif_mi: boolean
  olusturma_tarihi: string
}

export interface Kullanici {
  id: string
  ad_soyad: string
  eposta: string
  telefon?: string
  rol: KullaniciRolu
  aktif_mi: boolean
  olusturma_tarihi: string
}

export interface Proje {
  id: string
  proje_kodu: string
  proje_adi: string
  firma_id: string
  sozlesme_no?: string
  sozlesme_tarihi?: string
  hedef_teslim_tarihi?: string
  santiye_adresi: string
  il: string
  ilce?: string
  harita_konumu?: string
  satis_temsilcisi_id: string
  bayi_id?: string
  montaj_kapsami: ProjeKapsami[]
  blok_sayisi: number
  toplam_kollektor_sayisi: number
  toplam_sehpa_sayisi: number
  toplam_pano_sayisi?: number
  boyler_sayisi?: number
  boyler_kapasitesi_lt?: number
  pompa_grubu_sayisi?: number
  genlesme_tanki_sayisi?: number
  sistem_tipi?: SistemTipi
  durum: ProjeDurumu
  aktif_mi: boolean
  tamamlanma_tarihi?: string
  notlar?: string
  olusturan_id: string
  olusturma_tarihi: string
  guncelleme_tarihi: string
  // JOIN edilmiş alanlar
  firma?: Firma
  satis_temsilcisi?: Kullanici
  bayi?: Bayi
  bloklar?: Blok[]
  santiye_yetkilileri?: SantiyeYetkilisi[]
  rapor_alicilari?: RaporAlicisi[]
  proje_dokumanlari?: ProjeDokumani[]
  saha_raporlari?: SahaRaporu[]
}

export interface SantiyeYetkilisi {
  id: string
  proje_id: string
  ad_soyad: string
  gorevi?: SantiyeYetkilisisiGorevi
  telefon?: string
  eposta?: string
  birincil_mi: boolean
}

export interface RaporAlicisi {
  id: string
  proje_id: string
  eposta: string
  ad_soyad?: string
  alici_tipi: AliciTipi
  aktif_mi: boolean
}

export interface Blok {
  id: string
  proje_id: string
  blok_adi: string
  sira_no: number
  kollektor_sayisi?: number
  sehpa_sayisi?: number
  pano_sayisi?: number
  kat_sayisi?: number
  daire_sayisi?: number
  asamalar?: BlokAsamasi[]
}

export interface ProjeDokumani {
  id: string
  proje_id: string
  dokuman_tipi: DokumanTipi
  durum: DokumanDurumu
  revizyon_no?: string
  hazirlayan_id?: string
  gonderim_tarihi?: string
  onay_tarihi?: string
  dosya_ekleri?: string[]
  aciklama?: string
  olusturma_tarihi: string
  guncelleme_tarihi: string
}

export interface BlokAsamasi {
  id: string
  blok_id: string
  asama_tipi: AsamaTipi
  sira_no: number
  durum: AsamaDurumu
  sonuc?: AsamaSonucu
  kontrol_tarihi?: string
  kontrol_eden_id?: string
  aciklama?: string
  fotograflar?: string[]
  duzeltme_talep_edildi_mi?: boolean
  duzeltme_son_tarih?: string
  yeniden_kontrol_tarihi?: string
  guncelleme_gecmisi?: GuncellemeSatiri[]
  olusturma_tarihi: string
  guncelleme_tarihi: string
  // JOIN
  kontrol_eden?: Kullanici
}

export interface GuncellemeSatiri {
  kullanici_id: string
  kullanici_adi: string
  tarih: string
  eski_durum: AsamaDurumu
  yeni_durum: AsamaDurumu
  eski_sonuc?: AsamaSonucu
  yeni_sonuc?: AsamaSonucu
  aciklama?: string
  kural_atlandi_mi?: boolean
}

export interface SahaRaporu {
  id: string
  proje_id: string
  blok_idler: string[]
  rapor_tarihi: string
  hazirlayan_id: string
  rapor_tipi: RaporTipi
  ozet: string
  tespit_edilen_hatalar?: string
  yapilan_islemler?: string
  sonraki_adim?: string
  fotograflar?: string[]
  pdf_dosyasi?: string
  gonderildi_mi: boolean
  gonderim_tarihi?: string
  gonderilen_epostalar?: string[]
  gonderim_durumu?: GonderimDurumu
  olusturma_tarihi: string
  // JOIN
  hazirlayan?: Kullanici
}

export interface AktiviteLog {
  id: string
  kullanici_id: string
  tarih: string
  tablo: string
  kayit_id: string
  islem: 'ekleme' | 'guncelleme' | 'silme'
  eski_deger?: Record<string, unknown>
  yeni_deger?: Record<string, unknown>
  // JOIN
  kullanici?: Kullanici
}

// ─── UI Yardımcı Tipleri ─────────────────────────────────────────────────────

export interface ProjeOzeti extends Proje {
  saha_ilerleme_yuzdesi: number
  destek_ilerleme_yuzdesi: number
  acik_hata_sayisi: number
  son_hareket?: string
  gecikmiş_mi: boolean
  hareketsiz_mi: boolean
}

export const ASAMA_SIRALAMA: AsamaTipi[] = [
  'Kaide Kontrolü',
  'Dizilim',
  'Borulama',
  'Pano Bağlantısı',
  'Devreye Alma',
]

export const ASAMA_ETIKETI: Record<AsamaTipi, string> = {
  'Kaide Kontrolü': 'Kaide',
  'Dizilim': 'Dizilim',
  'Borulama': 'Borulama',
  'Pano Bağlantısı': 'Pano',
  'Devreye Alma': 'Devreye Alma',
}

export const KURUM_TIPLERI: KurumTipi[] = [
  'TOKİ',
  'Sağlık Bakanlığı',
  'Adalet Bakanlığı',
  'Gençlik ve Spor Bakanlığı',
  'MEB',
  'Belediye',
  'Özel Sektör',
  'Diğer',
]

export const SISTEM_TIPLERI: SistemTipi[] = [
  'Açık Devre',
  'Kapalı Devre',
  'Basınçlı',
  'Basınçsız',
  'Merkezi Sistem',
]

export const MONTAJ_KAPSAMI_SECENEKLERI: ProjeKapsami[] = [
  'Malzeme Satışı',
  'Panel Dizilim Montajı',
  'Borulama Montajı',
  'Pano Montajı',
  'Devreye Alma',
  'Proje Desteği',
]

export const ROL_ETIKETLERI: Record<KullaniciRolu, string> = {
  yonetici: 'Yönetici',
  satis_sonrasi_sorumlusu: 'Satış Sonrası Sorumlusu',
  saha_teknisyeni: 'Saha Teknisyeni',
  satis_temsilcisi: 'Satış Temsilcisi',
  bayi: 'Bayi',
}

export const TURKIYE_ILLERI = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
  'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
  'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
  'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir',
  'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
  'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
  'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük',
  'Kilis', 'Osmaniye', 'Düzce',
]
