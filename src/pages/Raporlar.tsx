import { useMemo, useState } from 'react'
import { useProjects, useKullanicilar } from '@/hooks/useProjects'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select } from '@/components/ui/FormField'
import { sahaIlerlemeHesapla, acikHataSayisi, formatTarih } from '@/lib/utils'
import { ASAMA_SIRALAMA, type AsamaTipi } from '@/lib/types'
import { differenceInDays } from 'date-fns'
import type { Proje, Blok } from '@/lib/types'

export default function Raporlar() {
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const { data: projeler = [], isLoading } = useProjects()
  const { data: kullanicilar = [] } = useKullanicilar()

  const filtreli = useMemo(() => {
    return projeler.filter((p) => {
      if (baslangic && p.olusturma_tarihi < baslangic) return false
      if (bitis && p.olusturma_tarihi > bitis + 'T23:59:59') return false
      return true
    })
  }, [projeler, baslangic, bitis])

  // Temsilci bazında istatistikler
  const temsilciStats = useMemo(() => {
    const map = new Map<string, { ad: string; proje: number; tamamlanan: number }>()
    filtreli.forEach((p) => {
      const tid = p.satis_temsilcisi_id
      const tad = p.satis_temsilcisi?.ad_soyad || 'Bilinmiyor'
      if (!map.has(tid)) map.set(tid, { ad: tad, proje: 0, tamamlanan: 0 })
      const entry = map.get(tid)!
      entry.proje++
      if (p.durum === 'Tamamlandı') entry.tamamlanan++
    })
    return Array.from(map.values()).sort((a, b) => b.proje - a.proje)
  }, [filtreli])

  // Kurum bazında dağılım
  const kurumStats = useMemo(() => {
    const map = new Map<string, number>()
    filtreli.forEach((p) => {
      const tip = p.firma?.kurum_tipi || 'Diğer'
      map.set(tip, (map.get(tip) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filtreli])

  // Aşama bazında hata oranı
  const asamaHataStats = useMemo(() => {
    const map = new Map<AsamaTipi, { toplam: number; hatali: number }>()
    ASAMA_SIRALAMA.forEach((tip) => map.set(tip, { toplam: 0, hatali: 0 }))

    filtreli.forEach((p) => {
      (p.bloklar || []).forEach((blok) => {
        ;(blok.asamalar || []).forEach((asama) => {
          const entry = map.get(asama.asama_tipi as AsamaTipi)
          if (!entry) return
          if (asama.durum === 'Tamamlandı') {
            entry.toplam++
            if (asama.sonuc === 'Hatalı') entry.hatali++
          }
        })
      })
    })

    return Array.from(map.entries())
  }, [filtreli])

  // Ortalama tamamlanma süresi
  const ortSure = useMemo(() => {
    const tamamlananlar = filtreli.filter(
      (p) => p.durum === 'Tamamlandı' && p.tamamlanma_tarihi && p.olusturma_tarihi
    )
    if (tamamlananlar.length === 0) return null
    const toplam = tamamlananlar.reduce((acc, p) => {
      return acc + differenceInDays(new Date(p.tamamlanma_tarihi!), new Date(p.olusturma_tarihi))
    }, 0)
    return Math.round(toplam / tamamlananlar.length)
  }, [filtreli])

  // İl bazında özet
  const ilStats = useMemo(() => {
    const map = new Map<string, number>()
    filtreli.forEach((p) => {
      map.set(p.il, (map.get(p.il) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filtreli])

  function exportExcel() {
    const satirlar = [
      ['Temsilci', 'Proje Sayısı', 'Tamamlanan'],
      ...temsilciStats.map((r) => [r.ad, String(r.proje), String(r.tamamlanan)]),
      [],
      ['Kurum Tipi', 'Proje Sayısı'],
      ...kurumStats.map(([tip, sayi]) => [tip, String(sayi)]),
      [],
      ['Aşama', 'Tamamlanan', 'Hatalı', 'Hata Oranı %'],
      ...asamaHataStats.map(([tip, s]) => [
        tip,
        String(s.toplam),
        String(s.hatali),
        s.toplam > 0 ? String(Math.round((s.hatali / s.toplam) * 100)) : '0',
      ]),
    ]
    const csv = satirlar.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapor-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Raporlar"
        aciklama="Proje istatistikleri ve analizler"
        eylemler={<Button variant="outline" size="sm" onClick={exportExcel}>↓ Excel</Button>}
      />

      {/* Tarih filtresi */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-3">
        <div className="flex gap-3 items-end flex-wrap">
          <FormField label="Başlangıç tarihi">
            {(id) => (
              <Input id={id} type="date" value={baslangic}
                onChange={(e) => setBaslangic(e.target.value)} className="w-40" />
            )}
          </FormField>
          <FormField label="Bitiş tarihi">
            {(id) => (
              <Input id={id} type="date" value={bitis}
                onChange={(e) => setBitis(e.target.value)} className="w-40" />
            )}
          </FormField>
          {(baslangic || bitis) && (
            <Button variant="ghost" size="sm" onClick={() => { setBaslangic(''); setBitis('') }}>
              Temizle
            </Button>
          )}
          <p className="text-sm text-[#6B7785] self-end pb-1">
            {filtreli.length} proje gösteriliyor
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {isLoading && <p className="text-sm text-[#6B7785]">Yükleniyor…</p>}

        {/* Özet sayılar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { baslik: 'Toplam proje', deger: filtreli.length },
            { baslik: 'Tamamlanan', deger: filtreli.filter((p) => p.durum === 'Tamamlandı').length },
            { baslik: 'Aktif', deger: filtreli.filter((p) => p.aktif_mi).length },
            { baslik: 'Ort. tamamlanma', deger: ortSure !== null ? `${ortSure} gün` : '—' },
          ].map((item) => (
            <Card key={item.baslik}>
              <p className="text-xs text-[#6B7785] font-medium">{item.baslik}</p>
              <p
                className="text-2xl font-bold text-[#0F1F33] mt-1"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {item.deger}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temsilci bazında */}
          <Card>
            <CardHeader title="Satış temsilcisine göre projeler" />
            {temsilciStats.length === 0 ? (
              <p className="text-sm text-[#6B7785]">Veri yok</p>
            ) : (
              <table className="w-full text-sm" aria-label="Temsilci istatistikleri">
                <thead>
                  <tr className="border-b border-[#D6DCE3]">
                    <th className="text-left text-xs text-[#6B7785] pb-2 font-semibold">Temsilci</th>
                    <th className="text-center text-xs text-[#6B7785] pb-2 font-semibold">Proje</th>
                    <th className="text-center text-xs text-[#6B7785] pb-2 font-semibold">Tamamlanan</th>
                  </tr>
                </thead>
                <tbody>
                  {temsilciStats.map((t) => (
                    <tr key={t.ad} className="border-b border-[#D6DCE3] last:border-0">
                      <td className="py-2 text-[#0F1F33]">{t.ad}</td>
                      <td className="py-2 text-center font-mono" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{t.proje}</td>
                      <td className="py-2 text-center font-mono text-[#1B7A4B]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{t.tamamlanan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Aşama hata oranı */}
          <Card>
            <CardHeader title="Aşama bazında hata oranı" subtitle="En çok hata yapılan iş hangi aşama?" />
            <div className="space-y-3">
              {asamaHataStats.map(([tip, stats]) => {
                const oran = stats.toplam > 0 ? Math.round((stats.hatali / stats.toplam) * 100) : 0
                return (
                  <div key={tip}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#0F1F33]">{tip}</span>
                      <span
                        className="font-mono text-[#6B7785]"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        {stats.hatali}/{stats.toplam} hatalı · %{oran}
                      </span>
                    </div>
                    <ProgressBar
                      yuzdesi={oran}
                      renk={oran > 20 ? '#B3261E' : oran > 10 ? '#9A6700' : '#1B7A4B'}
                      showLabel={false}
                    />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Kurum dağılımı */}
          <Card>
            <CardHeader title="Kurum tipine göre dağılım" />
            <div className="space-y-2">
              {kurumStats.map(([tip, sayi]) => (
                <div key={tip} className="flex items-center gap-3">
                  <span className="text-sm text-[#0F1F33] w-40 truncate">{tip}</span>
                  <div className="flex-1 h-2 bg-[#D6DCE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B4B73] rounded-full"
                      style={{ width: `${(sayi / (kurumStats[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                  <span
                    className="text-sm font-mono text-[#6B7785] w-6 text-right"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {sayi}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* İl bazında */}
          <Card>
            <CardHeader title="İl bazında proje listesi" />
            <table className="w-full text-sm" aria-label="İl istatistikleri">
              <thead>
                <tr className="border-b border-[#D6DCE3]">
                  <th className="text-left text-xs text-[#6B7785] pb-2 font-semibold">İl</th>
                  <th className="text-right text-xs text-[#6B7785] pb-2 font-semibold">Proje sayısı</th>
                </tr>
              </thead>
              <tbody>
                {ilStats.map(([il, sayi]) => (
                  <tr key={il} className="border-b border-[#D6DCE3] last:border-0">
                    <td className="py-2 text-[#0F1F33]">{il}</td>
                    <td
                      className="py-2 text-right font-mono text-[#6B7785]"
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {sayi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  )
}
