import { format, formatDistanceToNow, differenceInDays, differenceInCalendarDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Blok, ProjeDurumu, AsamaTipi } from './types'
import { HAREKETSIZLIK_ESIGI_GUN } from '@/config/firma'

// ─── Tarih biçimlendirme ──────────────────────────────────────

export function formatTarih(tarih: string | Date | undefined | null): string {
  if (!tarih) return '—'
  try { return format(new Date(tarih), 'dd.MM.yyyy', { locale: tr }) }
  catch { return '—' }
}

export function formatTarihSaat(tarih: string | Date | undefined | null): string {
  if (!tarih) return '—'
  try { return format(new Date(tarih), 'dd.MM.yyyy HH:mm', { locale: tr }) }
  catch { return '—' }
}

export function formatGoreceli(tarih: string | Date | undefined | null): string {
  if (!tarih) return '—'
  try { return formatDistanceToNow(new Date(tarih), { addSuffix: true, locale: tr }) }
  catch { return '—' }
}

// ─── İlerleme hesaplama ───────────────────────────────────────

export function sahaIlerlemeHesapla(bloklar: Blok[]): number {
  if (!bloklar || bloklar.length === 0) return 0
  const toplamAsama = bloklar.length * 5
  if (toplamAsama === 0) return 0
  const tamamlanan = bloklar.reduce((acc, blok) =>
    acc + (blok.asamalar?.filter(a => a.durum === 'Tamamlandı' && a.sonuc === 'Uygun').length ?? 0)
  , 0)
  return Math.floor((tamamlanan / toplamAsama) * 100)  // Aşağı yuvarla (K3)
}

export function devreAlinanBlokSayisi(bloklar: Blok[]): number {
  return bloklar.filter(blok => {
    const son = blok.asamalar?.find(a => a.asama_tipi === 'Devreye Alma')
    return son?.durum === 'Tamamlandı' && son?.sonuc === 'Uygun'
  }).length
}

export function acikHataSayisi(bloklar: Blok[]): number {
  return bloklar.reduce((acc, blok) =>
    acc + (blok.asamalar?.filter(a => a.sonuc === 'Hatalı').length ?? 0)
  , 0)
}

// ─── Proje durumları ──────────────────────────────────────────

export function projeGecikmeMi(hedefTarih: string | undefined, durum: ProjeDurumu): boolean {
  if (!hedefTarih || durum === 'Tamamlandı' || durum === 'İptal') return false
  return differenceInCalendarDays(new Date(), new Date(hedefTarih)) > 0
}

export function gecikmeGunSayisi(hedefTarih: string | undefined): number {
  if (!hedefTarih) return 0
  return Math.max(0, differenceInCalendarDays(new Date(), new Date(hedefTarih)))
}

export function hareketsizMi(sonHareketTarihi: string | undefined): boolean {
  if (!sonHareketTarihi) return false
  return differenceInDays(new Date(), new Date(sonHareketTarihi)) > HAREKETSIZLIK_ESIGI_GUN
}

export function hareketsizGunSayisi(sonHareketTarihi: string | undefined): number {
  if (!sonHareketTarihi) return 0
  return differenceInDays(new Date(), new Date(sonHareketTarihi))
}

// ─── Blok yardımcıları ────────────────────────────────────────

// Artık veritabanı üretiyor — eski kod uyumluluğu için tutuldu
export function projeKoduUret(_siraNo: number): string {
  return `SS-${new Date().getFullYear()}-????` // DB tarafında üretilir
}

export function blokAdlariUret(sayi: number, tip: 'harf' | 'sayi'): string[] {
  return Array.from({ length: sayi }, (_, i) =>
    tip === 'harf' ? `${String.fromCharCode(65 + i)} Blok` : `${i + 1}. Blok`
  )
}

export function oncekiAsamaTamamMi(
  asamalar: { asama_tipi: AsamaTipi; durum: string; sonuc?: string | null }[],
  mevcutSiraNo: number
): boolean {
  if (mevcutSiraNo <= 1) return true
  const siraMap: Record<AsamaTipi, number> = {
    'Kaide Kontrolü': 1, 'Dizilim': 2, 'Borulama': 3,
    'Pano Bağlantısı': 4, 'Devreye Alma': 5,
  }
  const onceki = asamalar.find(a => siraMap[a.asama_tipi] === mevcutSiraNo - 1)
  return onceki?.durum === 'Tamamlandı' && onceki?.sonuc === 'Uygun'
}

// ─── Genel yardımcılar ────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Türkçe sayı biçimlendirme: 1.234,56
export function formatSayi(sayi: number): string {
  return sayi.toLocaleString('tr-TR')
}

export function formatPara(sayi: number): string {
  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }) as T
}

// Excel CSV dışa aktarım (Türkçe karakter uyumlu UTF-8 BOM)
export function exportCSV(satirlar: string[][], dosyaAdi: string) {
  const csv = satirlar.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dosyaAdi
  a.click()
  URL.revokeObjectURL(url)
}
