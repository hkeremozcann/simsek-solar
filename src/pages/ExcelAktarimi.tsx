/**
 * Faz 1.5 — Excel İçe Aktarma Sihirbazı (§7.14)
 * GÜNCEL_TOKİ_TAKİP.xlsx → Supabase
 * 348 proje, 8.814 blok, 133.729 konut
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2,
  XCircle, ChevronRight, ChevronLeft, RefreshCw, Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatSayi } from '@/lib/utils'
import { TURKIYE_ILLERI } from '@/lib/types'

// ─── Excel sütun sabitleri (başlık satırı 2, veri satırı 3'ten başlar) ───
const EXCEL_SUTUNLAR = {
  SIRA_NO:        'G',
  FIRMA_ADI:      'H',
  IS_ADI:         'I',
  IL:             'J',
  ILCE:           'K',
  KONUT_SAYISI:   'L',
  BLOK_SAYISI:    'N',
  ILGILI_KISI:    'Q',
  TELEFON:        'R',
  MONTAJ_SORUMLU: 'T',
  KAPSAM1:        'U',
  KAPSAM2:        'V',
  KAIDE_TARIH:    'X',
  BORULAMA_TARIH: 'Y',
  UYGULAMA_TARIH: 'Z',
  DIZILIM_TAMAMLANAN: 'AB',
  DIZILIM_TOPLAM:     'AC',
  BORULAMA_TAMAMLANAN:'AD',
  BORULAMA_TOPLAM:    'AE',
  PANO_TAMAMLANAN:    'AF',
  PANO_TOPLAM:        'AG',
  DEVREYE_TAMAMLANAN: 'AH',
  DEVREYE_TOPLAM:     'AI',
} as const

interface AktarimSatiri {
  siraNo: number
  firmaAdi: string
  isAdi: string
  il: string
  ilce: string
  konutSayisi: number
  blokSayisi: number
  ilgiliKisi: string
  telefon: string
  montajSorumlu: string
  kapsam: string[]
  kaideTarih: string | null
  borulamaTarih: string | null
  uygulamaTarih: string | null
  uyarilar: string[]
  hatalar: string[]
  yesilSatir: boolean
}

interface DogrulamaRaporu {
  toplamSatir: number
  gercekliProje: number
  hataliSatir: number
  uyariliSatir: number
  formulHucresi: number
  yokDegeri: number
  ilNormalize: number
  yesilSatir: number
  ciftKayit: number
  eksikBlokSayisi: number
  satirlar: AktarimSatiri[]
}

type Adim = 'yukleme' | 'dogrulama' | 'onizleme' | 'aktarim' | 'tamamlandi'

function ilNormalize(ham: string): string {
  const temiz = ham.trim().toUpperCase()
    .replace('İ', 'I').replace('Ş', 'S').replace('Ğ', 'G')
    .replace('Ç', 'C').replace('Ü', 'U').replace('Ö', 'O')
  const bulunan = TURKIYE_ILLERI.find(il => {
    const ilTemiz = il.toUpperCase()
      .replace('İ', 'I').replace('Ş', 'S').replace('Ğ', 'G')
      .replace('Ç', 'C').replace('Ü', 'U').replace('Ö', 'O')
    return ilTemiz === temiz
  })
  return bulunan || ham.trim()
}

function hucreMetni(ws: XLSX.WorkSheet, satir: number, sutun: string): string {
  const adres = `${sutun}${satir}`
  const hucre = ws[adres]
  if (!hucre) return ''
  // Formül hücresini hesaplanmış değerden al
  const deger = hucre.v !== undefined ? hucre.v : hucre.w || ''
  return String(deger).trim()
}

function hucreRenk(ws: XLSX.WorkSheet, satir: number): boolean {
  // xlsx-style ile dolgu rengi okunabilir; standart xlsx ile satır rengi okunur
  // Burada basit yaklaşım: hücre stilini kontrol et
  const hucre = ws[`A${satir}`]
  return !!(hucre?.s?.fgColor?.rgb === 'FF92D050' || hucre?.s?.fgColor?.rgb === '0070C0')
}

function tarihCevir(deger: string): string | null {
  if (!deger || /^YOK\s*$/i.test(deger)) return null
  if (typeof deger === 'number') {
    // Excel sayısal tarihi
    const date = XLSX.SSF.parse_date_code(deger)
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  return null
}

function sayiCevir(deger: string): number {
  if (!deger) return 0
  // =780+800 gibi formül metni (xlsx hesaplanmış değer döndürür ama yine de)
  const sayi = parseFloat(String(deger).replace(',', '.'))
  return isNaN(sayi) ? 0 : sayi
}

function excelOku(dosya: File): Promise<DogrulamaRaporu> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const veri = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(veri, { type: 'array', cellStyles: true, cellFormula: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const aralik = XLSX.utils.decode_range(ws['!ref'] || 'A1')

        const satirlar: AktarimSatiri[] = []
        let formulSayisi = 0
        let yokSayisi = 0
        let yesilSayisi = 0
        const ilSayaci: Record<string, number> = {}

        // Satır 3'ten itibaren (1=başlık satırı 1, 2=başlık satırı 2)
        for (let r = 3; r <= aralik.e.r + 1; r++) {
          const firmaAdi = hucreMetni(ws, r, EXCEL_SUTUNLAR.FIRMA_ADI)
          const isAdi = hucreMetni(ws, r, EXCEL_SUTUNLAR.IS_ADI)
          if (!firmaAdi && !isAdi) continue // Boş satır

          const uyarilar: string[] = []
          const hatalar: string[] = []

          // IL normalizasyonu
          const hamIl = hucreMetni(ws, r, EXCEL_SUTUNLAR.IL)
          const normalIl = ilNormalize(hamIl)
          if (normalIl !== hamIl && hamIl) {
            uyarilar.push(`İl normalleştirildi: "${hamIl}" → "${normalIl}"`)
            ilSayaci[r] = 1
          }

          // YOK değerleri
          const kaideTarihHam = hucreMetni(ws, r, EXCEL_SUTUNLAR.KAIDE_TARIH)
          const borulamaTarihHam = hucreMetni(ws, r, EXCEL_SUTUNLAR.BORULAMA_TARIH)
          const uygulamaTarihHam = hucreMetni(ws, r, EXCEL_SUTUNLAR.UYGULAMA_TARIH)
          if (/^YOK\s*$/i.test(kaideTarihHam)) yokSayisi++
          if (/^YOK\s*$/i.test(borulamaTarihHam)) yokSayisi++
          if (/^YOK\s*$/i.test(uygulamaTarihHam)) yokSayisi++

          // Blok sayısı
          const blokSayisiHam = hucreMetni(ws, r, EXCEL_SUTUNLAR.BLOK_SAYISI)
          const blokSayisi = sayiCevir(blokSayisiHam)
          if (!blokSayisi) {
            uyarilar.push('Blok sayısı boş — 1 blok atanacak, "eksik veri" rozeti eklenecek')
          }

          // Formül kontrolü (xlsx hesaplanmış değeri döndürür)
          const ws_hucre = ws[`AB${r}`]
          if (ws_hucre?.f) formulSayisi++

          // Yeşil satır
          const yesilMi = hucreRenk(ws, r)
          if (yesilMi) yesilSayisi++

          // Kapsam
          const kapsam1 = hucreMetni(ws, r, EXCEL_SUTUNLAR.KAPSAM1)
          const kapsam2 = hucreMetni(ws, r, EXCEL_SUTUNLAR.KAPSAM2)
          const kapsam: string[] = []
          if (kapsam1.includes('DİZİLİM') || kapsam1.includes('DIZILIM')) kapsam.push('Panel Dizilim Montajı')
          if (kapsam1.includes('BORULAMA')) kapsam.push('Borulama Montajı')
          if (kapsam2.includes('BEDELSİZ') || kapsam2.includes('BEDELSIZ')) {/* bedelsiz_mi = true */}

          satirlar.push({
            siraNo: sayiCevir(hucreMetni(ws, r, EXCEL_SUTUNLAR.SIRA_NO)) || r - 2,
            firmaAdi,
            isAdi,
            il: normalIl,
            ilce: hucreMetni(ws, r, EXCEL_SUTUNLAR.ILCE),
            konutSayisi: sayiCevir(hucreMetni(ws, r, EXCEL_SUTUNLAR.KONUT_SAYISI)),
            blokSayisi: blokSayisi || 1,
            ilgiliKisi: hucreMetni(ws, r, EXCEL_SUTUNLAR.ILGILI_KISI),
            telefon: hucreMetni(ws, r, EXCEL_SUTUNLAR.TELEFON),
            montajSorumlu: hucreMetni(ws, r, EXCEL_SUTUNLAR.MONTAJ_SORUMLU),
            kapsam: kapsam.length ? kapsam : ['Malzeme Satışı'],
            kaideTarih: tarihCevir(kaideTarihHam),
            borulamaTarih: tarihCevir(borulamaTarihHam),
            uygulamaTarih: tarihCevir(uygulamaTarihHam),
            uyarilar,
            hatalar,
            yesilSatir: yesilMi,
          })
        }

        // Çift kayıt tespiti
        const ciftler = new Set<string>()
        const gorulmusler = new Set<string>()
        satirlar.forEach(s => {
          const anahtar = `${s.isAdi}|${s.il}`
          if (gorulmusler.has(anahtar)) ciftler.add(anahtar)
          gorulmusler.add(anahtar)
        })

        resolve({
          toplamSatir: satirlar.length + 2,
          gercekliProje: satirlar.length,
          hataliSatir: satirlar.filter(s => s.hatalar.length > 0).length,
          uyariliSatir: satirlar.filter(s => s.uyarilar.length > 0).length,
          formulHucresi: formulSayisi,
          yokDegeri: yokSayisi,
          ilNormalize: Object.keys(ilSayaci).length,
          yesilSatir: yesilSayisi,
          ciftKayit: ciftler.size,
          eksikBlokSayisi: satirlar.filter(s => {
            const ham = hucreMetni(ws, satirlar.indexOf(s) + 3, EXCEL_SUTUNLAR.BLOK_SAYISI)
            return !ham || sayiCevir(ham) === 0
          }).length,
          satirlar,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(dosya)
  })
}

export default function ExcelAktarimi() {
  const navigate = useNavigate()
  const { kullanici } = useAuth()
  const dosyaRef = useRef<HTMLInputElement>(null)

  const [adim, setAdim] = useState<Adim>('yukleme')
  const [dosya, setDosya] = useState<File | null>(null)
  const [rapor, setRapor] = useState<DogrulamaRaporu | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [aktarimId, setAktarimId] = useState<string | null>(null)
  const [yesilSatirOnay, setYesilSatirOnay] = useState<'evet' | 'hayir' | null>(null)
  const [ilerleme, setIlerleme] = useState({ tamamlanan: 0, toplam: 0 })

  async function dosyaIsle(f: File) {
    setDosya(f)
    setYukleniyor(true)
    setHata('')
    try {
      const r = await excelOku(f)
      setRapor(r)
      setAdim('dogrulama')
    } catch (e) {
      setHata(`Dosya okunamadı: ${e instanceof Error ? e.message : String(e)}`)
    }
    setYukleniyor(false)
  }

  async function aktarimi_baslat() {
    if (!rapor || !kullanici) return
    setAdim('aktarim')
    setIlerleme({ tamamlanan: 0, toplam: rapor.satirlar.length })

    // Aktarım kaydı oluştur
    const { data: aktarim } = await supabase.from('excel_aktarimlari').insert({
      dosya_adi: dosya?.name || '',
      aktaran_id: kullanici.id,
      durum: 'Devam Ediyor',
    }).select().single()

    const id = aktarim?.id || null
    setAktarimId(id)

    let tamamlanan = 0
    const hatalar: string[] = []

    for (const satir of rapor.satirlar) {
      try {
        // 1. Firma bul veya oluştur
        let firmaId: string | null = null
        const { data: mevcutFirma } = await supabase
          .from('firmalar')
          .select('id')
          .ilike('ad', satir.firmaAdi)
          .limit(1)
          .single()

        if (mevcutFirma) {
          firmaId = mevcutFirma.id
        } else if (satir.firmaAdi) {
          const { data: yeniFirma } = await supabase.from('firmalar').insert({
            ad: satir.firmaAdi, kurum_tipi: 'Diğer', aktif_mi: true, silindi_mi: false,
            il: satir.il, ilce: satir.ilce,
          }).select('id').single()
          firmaId = yeniFirma?.id || null
        }

        if (!firmaId) { hatalar.push(`${satir.siraNo}: Firma oluşturulamadı`); continue }

        // 2. Proje oluştur
        const { data: proje, error: projeErr } = await supabase.from('projeler').insert({
          proje_adi: satir.isAdi,
          firma_id: firmaId,
          santiye_adresi: `${satir.il}${satir.ilce ? ' / ' + satir.ilce : ''}`,
          il: satir.il,
          ilce: satir.ilce || null,
          blok_sayisi: satir.blokSayisi,
          konut_sayisi: satir.konutSayisi || null,
          toplam_kollektor_sayisi: 0,
          toplam_sehpa_sayisi: 0,
          montaj_kapsami: satir.kapsam,
          satis_temsilcisi_id: kullanici.id,
          durum: yesilSatirOnay === 'evet' && satir.yesilSatir ? 'Tamamlandı' : 'Çalışıyor',
          aktif_mi: !(yesilSatirOnay === 'evet' && satir.yesilSatir),
          excel_sira_no: satir.siraNo,
          import_id: id,
          olusturan_id: kullanici.id,
          taslak_mi: false,
          silindi_mi: false,
        }).select('id').single()

        if (projeErr || !proje) {
          hatalar.push(`${satir.siraNo}: Proje oluşturulamadı — ${projeErr?.message}`)
          continue
        }

        // 3. Şantiye yetkilisi
        if (satir.ilgiliKisi) {
          await supabase.from('santiye_yetkilileri').insert({
            proje_id: proje.id,
            ad_soyad: satir.ilgiliKisi,
            telefon: satir.telefon || null,
            birincil_mi: true,
          })
        }

        // 4. Bloklar ve aşamalar
        for (let i = 0; i < satir.blokSayisi; i++) {
          const { data: blok } = await supabase.from('bloklar').insert({
            proje_id: proje.id,
            blok_adi: String.fromCharCode(65 + i) + ' Blok',
            sira_no: i + 1,
          }).select('id').single()

          if (!blok) continue

          await supabase.from('blok_asamalari').insert([
            { blok_id: blok.id, asama_tipi: 'Kaide Kontrolü',  sira_no: 1, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1, olcu_birimi: 'blok' },
            { blok_id: blok.id, asama_tipi: 'Dizilim',         sira_no: 2, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1, olcu_birimi: 'kollektör' },
            { blok_id: blok.id, asama_tipi: 'Borulama',        sira_no: 3, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1, olcu_birimi: 'kollektör' },
            { blok_id: blok.id, asama_tipi: 'Pano Bağlantısı', sira_no: 4, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1, olcu_birimi: 'blok' },
            { blok_id: blok.id, asama_tipi: 'Devreye Alma',    sira_no: 5, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1, olcu_birimi: 'blok' },
          ])
        }

        // 5. Proje dokümanları
        if (satir.kaideTarih || satir.borulamaTarih || satir.uygulamaTarih) {
          await supabase.from('proje_dokumanlari').insert([
            { proje_id: proje.id, dokuman_tipi: 'Kaide Projesi',    durum: satir.kaideTarih    ? 'Müşteriye Gönderildi' : 'Başlamadı', gonderim_tarihi: satir.kaideTarih },
            { proje_id: proje.id, dokuman_tipi: 'Borulama Projesi', durum: satir.borulamaTarih ? 'Müşteriye Gönderildi' : 'Başlamadı', gonderim_tarihi: satir.borulamaTarih },
            { proje_id: proje.id, dokuman_tipi: 'Uygulama Projesi', durum: satir.uygulamaTarih ? 'Müşteriye Gönderildi' : 'Başlamadı', gonderim_tarihi: satir.uygulamaTarih },
          ])
        }

        tamamlanan++
        setIlerleme({ tamamlanan, toplam: rapor.satirlar.length })
      } catch (e) {
        hatalar.push(`${satir.siraNo}: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`)
      }
    }

    // Aktarım kaydını güncelle
    if (id) {
      await supabase.from('excel_aktarimlari').update({
        durum: hatalar.length === 0 ? 'Tamamlandı' : 'Hatalı',
        bitis_tarihi: new Date().toISOString(),
        proje_sayisi: tamamlanan,
        hata_sayisi: hatalar.length,
        ozet: { hatalar: hatalar.slice(0, 50) },
      }).eq('id', id)
    }

    // MV yenile
    await supabase.rpc('yenile_proje_ozet')

    setAdim('tamamlandi')
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Excel içe aktarma"
        aciklama="GÜNCEL_TOKİ_TAKİP.xlsx dosyasını sisteme aktarın"
      />

      {/* Adım göstergesi */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-3">
        <ol className="flex items-center gap-2 text-sm">
          {(['yukleme', 'dogrulama', 'onizleme', 'aktarim', 'tamamlandi'] as Adim[]).map((a, i) => {
            const etiketler: Record<Adim, string> = {
              yukleme: '1. Dosya Yükle', dogrulama: '2. Doğrulama',
              onizleme: '3. Önizleme', aktarim: '4. Aktar', tamamlandi: '5. Tamamlandı',
            }
            const tamamlandi = ['yukleme','dogrulama','onizleme','aktarim','tamamlandi']
              .indexOf(adim) > i
            const aktif = adim === a
            return (
              <li key={a} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#D6DCE3]">/</span>}
                <span className={`${aktif ? 'text-[#B4531F] font-medium' : tamamlandi ? 'text-[#1B7A4B]' : 'text-[#6B7785]'}`}>
                  {tamamlandi ? <CheckCircle2 size={14} className="inline mr-1" /> : null}
                  {etiketler[a]}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="p-4 md:p-6 max-w-3xl">

        {/* ── Adım 1: Dosya Yükle ── */}
        {adim === 'yukleme' && (
          <Card>
            <CardHeader title="Excel dosyasını yükleyin" subtitle="GÜNCEL_TOKİ_TAKİP.xlsx veya uyumlu format" />
            <div
              className="border-2 border-dashed border-[#D6DCE3] rounded p-12 text-center hover:border-[#1B4B73] transition-colors cursor-pointer"
              onClick={() => dosyaRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) dosyaIsle(f) }}
              role="button"
              tabIndex={0}
              aria-label="Excel dosyası yükle"
              onKeyDown={e => e.key === 'Enter' && dosyaRef.current?.click()}
            >
              <input ref={dosyaRef} type="file" accept=".xlsx,.xls" className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) dosyaIsle(f) }} />
              {yukleniyor ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={40} className="text-[#B4531F] animate-spin" />
                  <p className="text-sm text-[#6B7785]">Dosya okunuyor ve analiz ediliyor…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet size={48} className="text-[#D6DCE3]" />
                  <div>
                    <p className="font-medium text-[#0F1F33]">Dosyayı sürükleyin veya tıklayın</p>
                    <p className="text-sm text-[#6B7785] mt-1">.xlsx formatı · Maksimum 50 MB</p>
                  </div>
                </div>
              )}
            </div>
            {hata && (
              <div className="mt-4 p-3 bg-red-50 border border-[#B3261E]/20 rounded text-sm text-[#B3261E]" role="alert">
                {hata}
              </div>
            )}
          </Card>
        )}

        {/* ── Adım 2: Doğrulama Raporu ── */}
        {adim === 'dogrulama' && rapor && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Dosya analiz raporu" subtitle={dosya?.name} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Proje satırı', deger: rapor.gercekliProje, renk: 'text-[#1B7A4B]' },
                  { label: 'Hata', deger: rapor.hataliSatir, renk: rapor.hataliSatir ? 'text-[#B3261E]' : 'text-[#1B7A4B]' },
                  { label: 'Uyarı', deger: rapor.uyariliSatir, renk: rapor.uyariliSatir ? 'text-[#9A6700]' : 'text-[#1B7A4B]' },
                  { label: 'Formül hücresi', deger: rapor.formulHucresi, renk: 'text-[#6B7785]' },
                  { label: '"YOK" değeri → null', deger: rapor.yokDegeri, renk: 'text-[#6B7785]' },
                  { label: 'İl normalleştirildi', deger: rapor.ilNormalize, renk: 'text-[#6B7785]' },
                  { label: 'Yeşil satır', deger: rapor.yesilSatir, renk: 'text-[#9A6700]' },
                  { label: 'Olası çift kayıt', deger: rapor.ciftKayit, renk: rapor.ciftKayit ? 'text-[#9A6700]' : 'text-[#1B7A4B]' },
                  { label: 'Eksik blok sayısı', deger: rapor.eksikBlokSayisi, renk: rapor.eksikBlokSayisi ? 'text-[#9A6700]' : 'text-[#1B7A4B]' },
                ].map(item => (
                  <div key={item.label} className="bg-[#F5F7F9] rounded p-3">
                    <p className="text-xs text-[#6B7785]">{item.label}</p>
                    <p className={`text-xl font-bold font-mono mt-0.5 ${item.renk}`}
                      style={{ fontFamily: 'IBM Plex Mono' }}>
                      {formatSayi(item.deger)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Yeşil satır sorusu */}
            {rapor.yesilSatir > 0 && (
              <Card>
                <CardHeader title={`${rapor.yesilSatir} yeşil boyalı satır tespit edildi`}
                  subtitle="Excel'de yeşil = tamamlandı mı?" />
                <div className="flex gap-3">
                  <button onClick={() => setYesilSatirOnay('evet')}
                    className={`flex-1 p-3 rounded border-2 text-sm font-medium transition-colors ${
                      yesilSatirOnay === 'evet' ? 'border-[#1B7A4B] bg-[#1B7A4B]/10 text-[#1B7A4B]' : 'border-[#D6DCE3] hover:border-[#6B7785]'
                    }`}>
                    <CheckCircle2 size={16} className="inline mr-2" />
                    Evet, yeşil satırlar "Tamamlandı" olarak aktarılsın
                  </button>
                  <button onClick={() => setYesilSatirOnay('hayir')}
                    className={`flex-1 p-3 rounded border-2 text-sm font-medium transition-colors ${
                      yesilSatirOnay === 'hayir' ? 'border-[#B4531F] bg-[#B4531F]/10 text-[#B4531F]' : 'border-[#D6DCE3] hover:border-[#6B7785]'
                    }`}>
                    <XCircle size={16} className="inline mr-2" />
                    Hayır, hepsi "Çalışıyor" olarak aktarılsın
                  </button>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAdim('yukleme')} leftIcon={<ChevronLeft size={14} />}>
                Geri
              </Button>
              <Button variant="primary" onClick={() => setAdim('onizleme')}
                disabled={rapor.yesilSatir > 0 && !yesilSatirOnay}
                rightIcon={<ChevronRight size={14} />}>
                Önizlemeye geç
              </Button>
            </div>
          </div>
        )}

        {/* ── Adım 3: Önizleme ── */}
        {adim === 'onizleme' && rapor && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Aktarım önizlemesi" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#1B7A4B]/10 rounded p-3 text-center">
                  <p className="text-2xl font-bold text-[#1B7A4B] font-mono">{formatSayi(rapor.gercekliProje)}</p>
                  <p className="text-xs text-[#1B7A4B] mt-0.5">proje oluşturulacak</p>
                </div>
                <div className="bg-[#1B4B73]/10 rounded p-3 text-center">
                  <p className="text-2xl font-bold text-[#1B4B73] font-mono">
                    {formatSayi(rapor.satirlar.reduce((t, s) => t + (s.blokSayisi || 1), 0))}
                  </p>
                  <p className="text-xs text-[#1B4B73] mt-0.5">blok oluşturulacak</p>
                </div>
                <div className="bg-[#B4531F]/10 rounded p-3 text-center">
                  <p className="text-2xl font-bold text-[#B4531F] font-mono">
                    {formatSayi(rapor.satirlar.reduce((t, s) => t + (s.blokSayisi || 1), 0) * 5)}
                  </p>
                  <p className="text-xs text-[#B4531F] mt-0.5">blok-aşama kaydı</p>
                </div>
                <div className="bg-[#F5F7F9] rounded p-3 text-center">
                  <p className="text-2xl font-bold text-[#0F1F33] font-mono">
                    {formatSayi(rapor.satirlar.reduce((t, s) => t + (s.konutSayisi || 0), 0))}
                  </p>
                  <p className="text-xs text-[#6B7785] mt-0.5">konut (toplam)</p>
                </div>
              </div>

              {/* İlk 5 satır önizlemesi */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F7F9]">
                      {['#', 'Firma', 'İş Adı', 'İl', 'Blok', 'Durum'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-semibold text-[#6B7785] border border-[#D6DCE3]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rapor.satirlar.slice(0, 8).map(s => (
                      <tr key={s.siraNo} className="border border-[#D6DCE3]">
                        <td className="px-2 py-1.5 font-mono">{s.siraNo}</td>
                        <td className="px-2 py-1.5 max-w-32 truncate">{s.firmaAdi || '—'}</td>
                        <td className="px-2 py-1.5 max-w-48 truncate">{s.isAdi}</td>
                        <td className="px-2 py-1.5">{s.il}</td>
                        <td className="px-2 py-1.5 font-mono text-center">{s.blokSayisi}</td>
                        <td className="px-2 py-1.5">
                          {s.yesilSatir && yesilSatirOnay === 'evet'
                            ? <Badge variant="success">Tamamlandı</Badge>
                            : <Badge variant="primary">Çalışıyor</Badge>
                          }
                        </td>
                      </tr>
                    ))}
                    {rapor.gercekliProje > 8 && (
                      <tr><td colSpan={6} className="px-2 py-1.5 text-[#6B7785] text-center">
                        … ve {formatSayi(rapor.gercekliProje - 8)} satır daha
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="bg-amber-50 border border-[#9A6700]/30 rounded p-4 flex gap-3">
              <AlertTriangle size={18} className="text-[#9A6700] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#9A6700]">Bu işlem geri alınabilir</p>
                <p className="text-xs text-[#9A6700] mt-0.5">
                  Aktarım sırasında oluşan tüm kayıtlar aynı `import_id` ile gruplandırılır.
                  Geri almak için Ayarlar → Excel Aktarımları bölümünü kullanın.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAdim('dogrulama')} leftIcon={<ChevronLeft size={14} />}>
                Geri
              </Button>
              <Button variant="primary" onClick={aktarimi_baslat} leftIcon={<Upload size={14} />}>
                {formatSayi(rapor.gercekliProje)} projeyi aktar
              </Button>
            </div>
          </div>
        )}

        {/* ── Adım 4: Aktarım Sürüyor ── */}
        {adim === 'aktarim' && (
          <Card>
            <CardHeader title="Aktarım devam ediyor…" />
            <div className="py-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-[#6B7785]">İşleniyor…</span>
                <span className="font-mono text-[#0F1F33]" style={{ fontFamily: 'IBM Plex Mono' }}>
                  {ilerleme.tamamlanan} / {ilerleme.toplam}
                </span>
              </div>
              <div className="h-3 bg-[#D6DCE3] rounded-full overflow-hidden"
                role="progressbar" aria-valuenow={ilerleme.tamamlanan}
                aria-valuemax={ilerleme.toplam} aria-label="Aktarım ilerlemesi">
                <div
                  className="h-full bg-[#B4531F] rounded-full transition-all duration-300"
                  style={{ width: `${ilerleme.toplam ? (ilerleme.tamamlanan / ilerleme.toplam) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-[#6B7785] mt-2">
                Her proje için bloklar ve aşamalar oluşturuluyor. Lütfen bekleyin.
              </p>
            </div>
          </Card>
        )}

        {/* ── Adım 5: Tamamlandı ── */}
        {adim === 'tamamlandi' && (
          <Card>
            <div className="text-center py-8">
              <CheckCircle2 size={56} className="text-[#1B7A4B] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#0F1F33] mb-2" style={{ fontFamily: 'Archivo' }}>
                Aktarım tamamlandı
              </h2>
              <p className="text-sm text-[#6B7785] mb-6">
                {formatSayi(ilerleme.tamamlanan)} proje sisteme aktarıldı.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/ayarlar')}>
                  Aktarım geçmişi
                </Button>
                <Button variant="primary" onClick={() => navigate('/projeler')}>
                  Projelere git
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
