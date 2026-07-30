import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Blok, ProjeDurumu, AsamaTipi } from './types'

export function formatTarih(tarih: string | undefined | null): string {
  if (!tarih) return '—'
  try {
    return format(new Date(tarih), 'dd.MM.yyyy', { locale: tr })
  } catch {
    return '—'
  }
}

export function formatTarihSaat(tarih: string | undefined | null): string {
  if (!tarih) return '—'
  try {
    return format(new Date(tarih), 'dd.MM.yyyy HH:mm', { locale: tr })
  } catch {
    return '—'
  }
}

export function formatGoreceli(tarih: string | undefined | null): string {
  if (!tarih) return '—'
  try {
    return formatDistanceToNow(new Date(tarih), { addSuffix: true, locale: tr })
  } catch {
    return '—'
  }
}

export function sahaIlerlemeHesapla(bloklar: Blok[]): number {
  if (!bloklar || bloklar.length === 0) return 0
  const toplamAsama = bloklar.length * 5
  if (toplamAsama === 0) return 0
  const tamamlanan = bloklar.reduce((acc, blok) => {
    if (!blok.asamalar) return acc
    return acc + blok.asamalar.filter(
      (a) => a.durum === 'Tamamlandı' && a.sonuc === 'Uygun'
    ).length
  }, 0)
  return Math.round((tamamlanan / toplamAsama) * 100)
}

export function devreAlinanBlokSayisi(bloklar: Blok[]): number {
  return bloklar.filter((blok) => {
    const devreAlma = blok.asamalar?.find((a) => a.asama_tipi === 'Devreye Alma')
    return devreAlma?.durum === 'Tamamlandı' && devreAlma?.sonuc === 'Uygun'
  }).length
}

export function acikHataSayisi(bloklar: Blok[]): number {
  return bloklar.reduce((acc, blok) => {
    if (!blok.asamalar) return acc
    return acc + blok.asamalar.filter((a) => a.sonuc === 'Hatalı').length
  }, 0)
}

export function projeGecikmeMi(hedefTarih: string | undefined, durum: ProjeDurumu): boolean {
  if (!hedefTarih || durum === 'Tamamlandı' || durum === 'İptal') return false
  return differenceInDays(new Date(), new Date(hedefTarih)) > 0
}

export function blokAdlariUret(
  sayi: number,
  tip: 'harf' | 'sayi'
): string[] {
  return Array.from({ length: sayi }, (_, i) => {
    if (tip === 'harf') {
      return `${String.fromCharCode(65 + i)} Blok`
    }
    return `${i + 1}. Blok`
  })
}

export function projeKoduUret(siraNo: number): string {
  const yil = new Date().getFullYear()
  return `SS-${yil}-${String(siraNo).padStart(4, '0')}`
}

export function oncekiAsamaTamamMi(
  asamalar: { asama_tipi: AsamaTipi; durum: string; sonuc?: string }[],
  mevcutAsamaSiraNo: number
): boolean {
  if (mevcutAsamaSiraNo <= 1) return true
  const onceki = asamalar.find(
    (a) => {
      const siraMap: Record<AsamaTipi, number> = {
        'Kaide Kontrolü': 1,
        'Dizilim': 2,
        'Borulama': 3,
        'Pano Bağlantısı': 4,
        'Devreye Alma': 5,
      }
      return siraMap[a.asama_tipi as AsamaTipi] === mevcutAsamaSiraNo - 1
    }
  )
  return onceki?.durum === 'Tamamlandı'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function turkishToUpper(str: string): string {
  return str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase()
}
