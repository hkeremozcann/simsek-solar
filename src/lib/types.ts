// Şimşek Solar V2 — Tip Tanımları

export type KurumTipi =
  | 'TOKİ' | 'Sağlık Bakanlığı' | 'Adalet Bakanlığı'
  | 'Gençlik ve Spor Bakanlığı' | 'MEB' | 'Belediye'
  | 'Özel Sektör' | 'Diğer'

export type KullaniciRolu =
  | 'yonetici' | 'satis_sonrasi_sorumlusu'
  | 'saha_teknisyeni' | 'satis_temsilcisi' | 'bayi'

export type ProjeKapsami =
  | 'Malzeme Satışı' | 'Panel Dizilim Montajı' | 'Borulama Montajı'
  | 'Pano Montajı' | 'Devreye Alma' | 'Proje Desteği'

export type SistemTipi =
  | 'Açık Devre' | 'Kapalı Devre' | 'Basınçlı' | 'Basınçsız' | 'Merkezi Sistem'

export type ProjeDurumu = 'Çalışıyor' | 'Beklemede' | 'Tamamlandı' | 'İptal'
export type ManuelDurum = 'Beklemede' | 'İptal'

export type AsamaDurumu = 'Başlamadı' | 'Devam Ediyor' | 'Tamamlandı'
export type AsamaSonucu = 'Uygun' | 'Hatalı'

export type AsamaTipi =
  | 'Kaide Kontrolü' | 'Dizilim' | 'Borulama'
  | 'Pano Bağlantısı' | 'Devreye Alma'

export type DokumanTipi =
  | 'Kaide Projesi' | 'Borulama Projesi' | 'Uygulama Projesi'

export type DokumanDurumu =
  | 'Başlamadı' | 'Hazırlanıyor' | 'Müşteriye Gönderildi'
  | 'Revizyon İstendi' | 'Onaylandı'

export type HataDurumu =
  | 'Açık' | 'Düzeltiliyor' | 'Yeniden Kontrolde' | 'Kapandı' | 'Kabul Edildi'

export type HataSiddeti = 'Kritik' | 'Majör' | 'Minör'

export type SorumluTaraf =
  | 'Şimşek Solar Ekibi' | 'Ana Yüklenici' | 'Taşeron'
  | 'Bayi' | 'Malzeme/Üretim' | 'Belirsiz'

export type EksikImalatDurumu =
  | 'Açık' | 'Sipariş Verildi' | 'Sahaya Sevk Edildi' | 'Tamamlandı'

export type RaporTipi =
  | 'İlk Keşif' | 'Ara Kontrol' | 'Kaide Kontrol' | 'Montaj Kontrol'
  | 'Devreye Alma' | 'Arıza/Servis' | 'Kesin Teslim'

export type GonderimDurumu = 'Bekliyor' | 'Başarılı' | 'Hatalı'
export type AliciTipi = 'Kime' | 'Bilgi'
export type SantiyeGorev =
  | 'Şantiye Şefi' | 'Kontrol Amiri' | 'Teknik Ofis' | 'Taşeron Yetkilisi' | 'Diğer'

// ─── Veritabanı Satır Tipleri ────────────────────────────────

export interface Firma {
  id: string; ad: string; kurum_tipi: KurumTipi
  ana_yuklenici?: string; vergi_dairesi?: string; vergi_no?: string
  adres?: string; il?: string; ilce?: string
  telefon?: string; genel_eposta?: string; notlar?: string
  aktif_mi: boolean; silindi_mi: boolean
  olusturma_tarihi: string; guncelleme_tarihi: string
}

export interface Bayi {
  id: string; ad: string; yetkili_kisi?: string
  telefon?: string; eposta?: string; il?: string
  aktif_mi: boolean; olusturma_tarihi: string
}

export interface Kullanici {
  id: string; ad_soyad: string; eposta: string; telefon?: string
  rol: KullaniciRolu; bayi_id?: string; aktif_mi: boolean
  son_giris_tarihi?: string; olusturma_tarihi: string
}

export interface Proje {
  id: string; proje_kodu: string; proje_adi: string
  firma_id: string; sozlesme_no?: string
  sozlesme_tarihi?: string; hedef_teslim_tarihi?: string
  santiye_adresi: string; il: string; ilce?: string
  enlem?: number; boylam?: number
  satis_temsilcisi_id: string; bayi_id?: string
  montaj_kapsami: ProjeKapsami[]
  blok_sayisi: number; toplam_kollektor_sayisi: number
  toplam_sehpa_sayisi: number; toplam_pano_sayisi?: number
  boyler_sayisi?: number; boyler_kapasitesi_lt?: number
  pompa_grubu_sayisi?: number; genlesme_tanki_sayisi?: number
  sistem_tipi?: SistemTipi
  durum: ProjeDurumu; manuel_durum?: ManuelDurum
  aktif_mi: boolean; tamamlanma_tarihi?: string
  son_hareket_tarihi?: string; notlar?: string
  olusturan_id?: string; taslak_mi: boolean; silindi_mi: boolean
  olusturma_tarihi: string; guncelleme_tarihi: string
  // JOIN
  firma?: Firma; satis_temsilcisi?: Kullanici; bayi?: Bayi
  bloklar?: Blok[]; santiye_yetkilileri?: SantiyeYetkilisi[]
  rapor_alicilari?: RaporAlicisi[]; proje_dokumanlari?: ProjeDokumani[]
  saha_raporlari?: SahaRaporu[]; hatalar?: Hata[]
}

export interface SantiyeYetkilisi {
  id: string; proje_id: string; ad_soyad: string
  gorevi?: SantiyeGorev; telefon?: string; eposta?: string
  birincil_mi: boolean; olusturma_tarihi: string
}

export interface RaporAlicisi {
  id: string; proje_id: string; eposta: string
  ad_soyad?: string; alici_tipi: AliciTipi; aktif_mi: boolean
}

export interface Blok {
  id: string; proje_id: string; blok_adi: string; sira_no: number
  kollektor_sayisi?: number; sehpa_sayisi?: number; pano_sayisi?: number
  kat_sayisi?: number; daire_sayisi?: number; olusturma_tarihi: string
  asamalar?: BlokAsamasi[]
}

export interface ProjeDokumani {
  id: string; proje_id: string; dokuman_tipi: DokumanTipi
  durum: DokumanDurumu; revizyon_no?: string; hazirlayan_id?: string
  gonderim_tarihi?: string; onay_tarihi?: string; aciklama?: string
  olusturma_tarihi: string; guncelleme_tarihi: string
}

export interface BlokAsamasi {
  id: string; blok_id: string; asama_tipi: AsamaTipi; sira_no: number
  durum: AsamaDurumu; sonuc?: AsamaSonucu
  baslama_tarihi?: string; kontrol_tarihi?: string
  kontrol_eden_id?: string; aciklama?: string
  ilk_kontrol_sonucu?: AsamaSonucu; kontrol_sayisi: number
  surum: number
  olusturma_tarihi: string; guncelleme_tarihi: string
  kontrol_eden?: Kullanici
}

export interface Hata {
  id: string; hata_kodu: string; proje_id: string
  blok_id?: string; blok_asama_id?: string
  kategori: string; siddet: HataSiddeti; sorumlu_taraf: SorumluTaraf
  aciklama: string; kok_neden?: string
  tespit_eden_id?: string; tespit_tarihi: string
  atanan_id?: string; son_tarih?: string
  durum: HataDurumu; kapanma_tarihi?: string; kapatan_id?: string
  tekrar_sayisi: number; tahmini_maliyet?: number
  oncesi_fotograflar: string[]; sonrasi_fotograflar: string[]
  olusturma_tarihi: string; guncelleme_tarihi: string
  tespit_eden?: Kullanici; atanan?: Kullanici
}

export interface EksikImalat {
  id: string; proje_id: string; blok_id?: string
  asama_tipi?: AsamaTipi; kalem: string
  planlanan_adet: number; mevcut_adet: number
  engelleyici_mi: boolean; sorumlu_taraf?: string
  tahmini_kapanma_tarihi?: string; durum: EksikImalatDurumu
  aciklama?: string; olusturan_id?: string
  olusturma_tarihi: string; guncelleme_tarihi: string
}

export interface SahaRaporu {
  id: string; proje_id: string; blok_idler: string[]
  rapor_no: string; rapor_tarihi: string; hazirlayan_id: string
  rapor_tipi: RaporTipi; ozet: string
  tespit_edilen_hatalar?: string; yapilan_islemler?: string; sonraki_adim?: string
  pdf_url?: string; gonderildi_mi: boolean
  gonderim_tarihi?: string; gonderilen_epostalar: string[]
  gonderim_durumu?: GonderimDurumu; hata_mesaji?: string; deneme_sayisi: number
  olusturma_tarihi: string
  hazirlayan?: Kullanici
}

export interface AktiviteLog {
  id: string; kullanici_id?: string; tarih: string
  tablo: string; kayit_id?: string; proje_id?: string
  islem: 'ekleme' | 'guncelleme' | 'silme' | 'giris' | 'gonderim' | 'kural_asimi'
  alan?: string; eski_deger?: string; yeni_deger?: string
  gerekce?: string; ip?: string
  kullanici?: Kullanici
}

export interface Bildirim {
  id: string; kullanici_id: string; tip: string
  baslik: string; mesaj?: string; hedef_url?: string
  okundu_mu: boolean; olusturma_tarihi: string
}

export interface MvProjeOzet {
  id: string; proje_kodu: string; proje_adi: string
  durum: ProjeDurumu; il: string; blok_sayisi: number
  hedef_teslim_tarihi?: string; tamamlanma_tarihi?: string
  son_hareket_tarihi?: string; satis_temsilcisi_id: string
  firma_id: string; kurum_tipi: KurumTipi
  toplam_blok: number; tamamlanan_asama: number; toplam_asama: number
  saha_yuzdesi: number; acik_hata: number
  gecikmis_mi: boolean; hareketsiz_mi: boolean
}

// ─── Sabitler ────────────────────────────────────────────────

export const ASAMA_SIRALAMA: AsamaTipi[] = [
  'Kaide Kontrolü', 'Dizilim', 'Borulama', 'Pano Bağlantısı', 'Devreye Alma',
]

// V1 uyumluluk aliası
export const ASAMA_ETIKETI = {
  'Kaide Kontrolü': 'Kaide',
  'Dizilim': 'Dizilim',
  'Borulama': 'Borulama',
  'Pano Bağlantısı': 'Pano',
  'Devreye Alma': 'Devreye Alma',
} as const

export const ASAMA_KISA: Record<AsamaTipi, string> = {
  'Kaide Kontrolü': 'Kaide',
  'Dizilim': 'Dizilim',
  'Borulama': 'Borulama',
  'Pano Bağlantısı': 'Pano',
  'Devreye Alma': 'Devreye',
}

export const KURUM_TIPLERI: KurumTipi[] = [
  'TOKİ', 'Sağlık Bakanlığı', 'Adalet Bakanlığı',
  'Gençlik ve Spor Bakanlığı', 'MEB', 'Belediye', 'Özel Sektör', 'Diğer',
]

export const SISTEM_TIPLERI: SistemTipi[] = [
  'Açık Devre', 'Kapalı Devre', 'Basınçlı', 'Basınçsız', 'Merkezi Sistem',
]

// V1 uyumluluk aliası
export const MONTAJ_KAPSAMI_SECENEKLERI = [
  'Malzeme Satışı', 'Panel Dizilim Montajı', 'Borulama Montajı',
  'Pano Montajı', 'Devreye Alma', 'Proje Desteği',
] as const

export const MONTAJ_KAPSAMI_LISTESI: ProjeKapsami[] = [
  'Malzeme Satışı', 'Panel Dizilim Montajı', 'Borulama Montajı',
  'Pano Montajı', 'Devreye Alma', 'Proje Desteği',
]

export const ROL_ETIKETLERI: Record<KullaniciRolu, string> = {
  yonetici: 'Yönetici',
  satis_sonrasi_sorumlusu: 'Satış Sonrası Sorumlusu',
  saha_teknisyeni: 'Saha Teknisyeni',
  satis_temsilcisi: 'Satış Temsilcisi',
  bayi: 'Bayi',
}

export const HATA_KATEGORILERI: Record<AsamaTipi | 'Ortak', string[]> = {
  'Kaide Kontrolü': ['kot hatası', 'ölçü hatası', 'ankraj eksik/yanlış', 'yalıtım delinmiş', 'kaide yönü/açısı', 'beton mukavemeti', 'su tahliyesi'],
  'Dizilim': ['sehpa açısı hatalı', 'sehpa sabitleme eksik', 'kollektör sırası/aralığı', 'gölgelenme', 'kollektör hasarlı', 'conta/rakor sızdırma'],
  'Borulama': ['eğim hatası', 'izolasyon eksik/hasarlı', 'kaynak/lehim hatası', 'hava alma eksik', 'boru çapı yanlış', 'askı/kelepçe eksik', 'sızdırma'],
  'Pano Bağlantısı': ['kablo kesiti yanlış', 'topraklama eksik', 'sensör bağlantısı hatalı', 'pano konumu', 'etiketleme eksik', 'sigorta/koruma eksik'],
  'Devreye Alma': ['basınç düşük', 'pompa yönü ters', 'genleşme tankı basıncı', 'sıcaklık ayarı', 'sirkülasyon yok', 'otomasyon parametresi'],
  'Ortak': ['malzeme eksik', 'malzeme hasarlı', 'iş güvenliği', 'temizlik/düzen'],
}

export const TURKIYE_ILLERI = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya',
  'Artvin','Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu',
  'Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır',
  'Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun',
  'Gümüşhane','Hakkari','Hatay','Isparta','Mersin','İstanbul','İzmir',
  'Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli','Konya',
  'Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop',
  'Sivas','Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak',
  'Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman','Kırıkkale',
  'Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük',
  'Kilis','Osmaniye','Düzce',
]
