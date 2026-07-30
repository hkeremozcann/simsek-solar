import { describe, it, expect } from 'vitest'
import {
  sahaIlerlemeHesapla,
  devreAlinanBlokSayisi,
  acikHataSayisi,
  projeGecikmeMi,
  hareketsizMi,
  oncekiAsamaTamamMi,
} from './utils'
import type { Blok, BlokAsamasi, AsamaTipi } from './types'

// ─── Test yardımcıları ────────────────────────────────────────

function asama(tip: AsamaTipi, siraNo: number, durum: 'Başlamadı' | 'Devam Ediyor' | 'Tamamlandı', sonuc?: 'Uygun' | 'Hatalı'): BlokAsamasi {
  return {
    id: `${tip}-${Math.random()}`, blok_id: 'blok1', asama_tipi: tip,
    sira_no: siraNo, durum, sonuc, kontrol_sayisi: 0, surum: 1,
    olusturma_tarihi: new Date().toISOString(), guncelleme_tarihi: new Date().toISOString(),
  }
}

function blok(asamalar: BlokAsamasi[]): Blok {
  return {
    id: `blok-${Math.random()}`, proje_id: 'proje1', blok_adi: 'A Blok',
    sira_no: 1, olusturma_tarihi: new Date().toISOString(), asamalar,
  }
}

function tamBlok(): Blok {
  return blok([
    asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Uygun'),
    asama('Dizilim', 2, 'Tamamlandı', 'Uygun'),
    asama('Borulama', 3, 'Tamamlandı', 'Uygun'),
    asama('Pano Bağlantısı', 4, 'Tamamlandı', 'Uygun'),
    asama('Devreye Alma', 5, 'Tamamlandı', 'Uygun'),
  ])
}

function bosBlok(): Blok {
  return blok([
    asama('Kaide Kontrolü', 1, 'Başlamadı'),
    asama('Dizilim', 2, 'Başlamadı'),
    asama('Borulama', 3, 'Başlamadı'),
    asama('Pano Bağlantısı', 4, 'Başlamadı'),
    asama('Devreye Alma', 5, 'Başlamadı'),
  ])
}

// ─── K1: Saha ilerleme yüzdesi ────────────────────────────────

describe('K3 — sahaIlerlemeHesapla', () => {
  it('boş projede 0 döner', () => {
    expect(sahaIlerlemeHesapla([])).toBe(0)
  })

  it('hiçbir aşama tamamlanmamışsa 0', () => {
    expect(sahaIlerlemeHesapla([bosBlok(), bosBlok()])).toBe(0)
  })

  it('tüm aşamalar uygun ise 100', () => {
    expect(sahaIlerlemeHesapla([tamBlok(), tamBlok()])).toBe(100)
  })

  it('1/2 blok tamamsa 50', () => {
    expect(sahaIlerlemeHesapla([tamBlok(), bosBlok()])).toBe(50)
  })

  it('12 blokta 11 tam, biri yarım = 91 (aşağı yuvarlama K3)', () => {
    const yarimBlok = blok([
      asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Uygun'),
      asama('Dizilim', 2, 'Tamamlandı', 'Uygun'),
      asama('Borulama', 3, 'Tamamlandı', 'Uygun'),
      asama('Pano Bağlantısı', 4, 'Tamamlandı', 'Uygun'),
      asama('Devreye Alma', 5, 'Devam Ediyor'),
    ])
    const bloklar = [...Array(11).fill(null).map(() => tamBlok()), yarimBlok]
    // 11*5 + 4 = 59 / 60 = 98.33 → 98 (aşağı yuvarlama)
    expect(sahaIlerlemeHesapla(bloklar)).toBe(98)
  })

  it('Hatalı aşama tamamlanmış sayılmaz', () => {
    const hataliBlok = blok([
      asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Hatalı'),
      asama('Dizilim', 2, 'Başlamadı'),
      asama('Borulama', 3, 'Başlamadı'),
      asama('Pano Bağlantısı', 4, 'Başlamadı'),
      asama('Devreye Alma', 5, 'Başlamadı'),
    ])
    expect(sahaIlerlemeHesapla([hataliBlok])).toBe(0)
  })
})

// ─── K1: Devreye alınan blok sayısı ──────────────────────────

describe('K1 — devreAlinanBlokSayisi', () => {
  it('hiç devreye alınmamışsa 0', () => {
    expect(devreAlinanBlokSayisi([bosBlok()])).toBe(0)
  })

  it('devreye alma uygun ise sayılır', () => {
    expect(devreAlinanBlokSayisi([tamBlok()])).toBe(1)
  })

  it('devreye alma hatalı ise sayılmaz', () => {
    const b = blok([
      asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Uygun'),
      asama('Dizilim', 2, 'Tamamlandı', 'Uygun'),
      asama('Borulama', 3, 'Tamamlandı', 'Uygun'),
      asama('Pano Bağlantısı', 4, 'Tamamlandı', 'Uygun'),
      asama('Devreye Alma', 5, 'Tamamlandı', 'Hatalı'),
    ])
    expect(devreAlinanBlokSayisi([b])).toBe(0)
  })

  it('11/12 blok devreye alındıysa 11', () => {
    const yarimBlok = blok([
      asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Uygun'),
      asama('Dizilim', 2, 'Tamamlandı', 'Uygun'),
      asama('Borulama', 3, 'Tamamlandı', 'Uygun'),
      asama('Pano Bağlantısı', 4, 'Tamamlandı', 'Uygun'),
      asama('Devreye Alma', 5, 'Devam Ediyor'),
    ])
    const bloklar = [...Array(11).fill(null).map(() => tamBlok()), yarimBlok]
    expect(devreAlinanBlokSayisi(bloklar)).toBe(11)
  })
})

// ─── K2: Açık hata sayısı ─────────────────────────────────────

describe('K2 — acikHataSayisi', () => {
  it('hata yoksa 0', () => {
    expect(acikHataSayisi([tamBlok()])).toBe(0)
  })

  it('hatalı aşama sayılır', () => {
    const b = blok([
      asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Hatalı'),
      asama('Dizilim', 2, 'Tamamlandı', 'Hatalı'),
      asama('Borulama', 3, 'Başlamadı'),
      asama('Pano Bağlantısı', 4, 'Başlamadı'),
      asama('Devreye Alma', 5, 'Başlamadı'),
    ])
    expect(acikHataSayisi([b])).toBe(2)
  })
})

// ─── K5: Gecikme ─────────────────────────────────────────────

describe('K5 — projeGecikmeMi', () => {
  it('tamamlanmış proje gecikmiş sayılmaz', () => {
    const gecen = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
    expect(projeGecikmeMi(gecen, 'Tamamlandı')).toBe(false)
  })

  it('geçmiş tarihli çalışıyor proje gecikmiş', () => {
    const gecen = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    expect(projeGecikmeMi(gecen, 'Çalışıyor')).toBe(true)
  })

  it('gelecek tarih gecikmiş değil', () => {
    const gelecek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()
    expect(projeGecikmeMi(gelecek, 'Çalışıyor')).toBe(false)
  })

  it('hedef tarih yoksa gecikmiş değil', () => {
    expect(projeGecikmeMi(undefined, 'Çalışıyor')).toBe(false)
  })
})

// ─── K6: Durgunluk ────────────────────────────────────────────

describe('K6 — hareketsizMi', () => {
  it('31 gün önce hareket eden proje hareketsiz', () => {
    const eski = new Date(Date.now() - 1000 * 60 * 60 * 24 * 31).toISOString()
    expect(hareketsizMi(eski)).toBe(true)
  })

  it('10 gün önce hareket eden proje aktif', () => {
    const yeni = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
    expect(hareketsizMi(yeni)).toBe(false)
  })
})

// ─── K7: Sıra kuralı ─────────────────────────────────────────

describe('K7 — oncekiAsamaTamamMi', () => {
  const asamalar = [
    asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Uygun'),
    asama('Dizilim', 2, 'Başlamadı'),
    asama('Borulama', 3, 'Başlamadı'),
    asama('Pano Bağlantısı', 4, 'Başlamadı'),
    asama('Devreye Alma', 5, 'Başlamadı'),
  ]

  it('ilk aşama için önceki şart yok', () => {
    expect(oncekiAsamaTamamMi(asamalar, 1)).toBe(true)
  })

  it('kaide uygun ise dizilim başlayabilir', () => {
    expect(oncekiAsamaTamamMi(asamalar, 2)).toBe(true)
  })

  it('dizilim başlamadıysa borulama başlayamaz', () => {
    expect(oncekiAsamaTamamMi(asamalar, 3)).toBe(false)
  })

  it('önceki hatalı ise sonraki başlayamaz', () => {
    const hataliAsamalar = [
      asama('Kaide Kontrolü', 1, 'Tamamlandı', 'Hatalı'),
      asama('Dizilim', 2, 'Başlamadı'),
      asama('Borulama', 3, 'Başlamadı'),
      asama('Pano Bağlantısı', 4, 'Başlamadı'),
      asama('Devreye Alma', 5, 'Başlamadı'),
    ]
    expect(oncekiAsamaTamamMi(hataliAsamalar, 2)).toBe(false)
  })
})
