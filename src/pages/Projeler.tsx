import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useKullanicilar } from '@/hooks/useProjects'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ProjeDurumBadge, Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/FormField'
import { sahaIlerlemeHesapla, acikHataSayisi, projeGecikmeMi, formatTarih, formatGoreceli } from '@/lib/utils'
import { TURKIYE_ILLERI, type ProjeDurumu } from '@/lib/types'
import type { Proje } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

type SiralamaAlan = 'proje_kodu' | 'proje_adi' | 'olusturma_tarihi' | 'hedef_teslim_tarihi'

export default function Projeler() {
  const navigate = useNavigate()
  const { rolKontrol } = useAuth()
  const [arama, setArama] = useState('')
  const [durumFiltre, setDurumFiltre] = useState('')
  const [ilFiltre, setIlFiltre] = useState('')
  const [temsilciFiltre, setTemsilciFiltre] = useState('')
  const [sadecHatali, setSadeceHatali] = useState(false)
  const [sadecGecikmiş, setSadeceGecikmiş] = useState(false)
  const [siralama, setSiralama] = useState<SiralamaAlan>('olusturma_tarihi')
  const [siralamaYon, setSiralamaYon] = useState<'asc' | 'desc'>('desc')

  const { data: projeData, isLoading, error } = useProjects({
    durum: durumFiltre || undefined,
    il: ilFiltre || undefined,
    satis_temsilcisi_id: temsilciFiltre || undefined,
  })

  const projeler = projeData?.projeler ?? []
  const { data: kullanicilar = [] } = useKullanicilar()

  const filtrelenmis = useMemo(() => {
    let list = [...projeler]

    if (arama.trim()) {
      const q = arama.toLowerCase()
      list = list.filter((p) =>
        p.proje_kodu.toLowerCase().includes(q) ||
        p.proje_adi.toLowerCase().includes(q) ||
        p.firma?.ad.toLowerCase().includes(q) || false
      )
    }

    if (sadecHatali) {
      list = list.filter((p) => p.bloklar && acikHataSayisi(p.bloklar) > 0)
    }

    if (sadecGecikmiş) {
      list = list.filter((p) => projeGecikmeMi(p.hedef_teslim_tarihi, p.durum))
    }

    list.sort((a, b) => {
      const valA = String(a[siralama] || '')
      const valB = String(b[siralama] || '')
      const cmp = valA.localeCompare(valB, 'tr')
      return siralamaYon === 'asc' ? cmp : -cmp
    })

    return list
  }, [projeler, arama, sadecHatali, sadecGecikmiş, siralama, siralamaYon])

  function toggleSiralama(alan: SiralamaAlan) {
    if (siralama === alan) {
      setSiralamaYon((y) => (y === 'asc' ? 'desc' : 'asc'))
    } else {
      setSiralama(alan)
      setSiralamaYon('asc')
    }
  }

  function exportCSV() {
    const satirlar = [
      ['Kod', 'Proje Adı', 'Kurum', 'İl', 'Blok', 'İlerleme %', 'Durum', 'Temsilci', 'Hedef Tarih'],
      ...filtrelenmis.map((p) => [
        p.proje_kodu,
        p.proje_adi,
        p.firma?.ad || '',
        p.il,
        String(p.blok_sayisi),
        String(sahaIlerlemeHesapla(p.bloklar || [])),
        p.durum,
        p.satis_temsilcisi?.ad_soyad || '',
        formatTarih(p.hedef_teslim_tarihi),
      ]),
    ]
    const csv = satirlar.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projeler-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const temsilciler = kullanicilar.filter((k) =>
    ['satis_temsilcisi', 'satis_sonrasi_sorumlusu', 'yonetici'].includes(k.rol)
  )

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Projeler"
        aciklama={`${filtrelenmis.length} proje listeleniyor`}
        eylemler={
          <>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              ↓ CSV
            </Button>
            {rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu']) && (
              <Button variant="primary" size="sm" onClick={() => navigate('/projeler/yeni')}>
                + Yeni proje ekle
              </Button>
            )}
          </>
        }
      />

      {/* Filtreler */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Proje kodu, adı, firma..."
              aria-label="Proje arama"
            />
          </div>

          <Select
            value={durumFiltre}
            onChange={(e) => setDurumFiltre(e.target.value)}
            className="w-36"
            aria-label="Durum filtresi"
          >
            <option value="">Tüm durumlar</option>
            <option value="Çalışıyor">Çalışıyor</option>
            <option value="Beklemede">Beklemede</option>
            <option value="Tamamlandı">Tamamlandı</option>
            <option value="İptal">İptal</option>
          </Select>

          <Select
            value={ilFiltre}
            onChange={(e) => setIlFiltre(e.target.value)}
            className="w-36"
            aria-label="İl filtresi"
          >
            <option value="">Tüm iller</option>
            {TURKIYE_ILLERI.sort().map((il) => (
              <option key={il} value={il}>{il}</option>
            ))}
          </Select>

          <Select
            value={temsilciFiltre}
            onChange={(e) => setTemsilciFiltre(e.target.value)}
            className="w-44"
            aria-label="Temsilci filtresi"
          >
            <option value="">Tüm temsilciler</option>
            {temsilciler.map((k) => (
              <option key={k.id} value={k.id}>{k.ad_soyad}</option>
            ))}
          </Select>

          <label className="flex items-center gap-1.5 text-sm cursor-pointer min-h-[44px] px-2">
            <input
              type="checkbox"
              checked={sadecHatali}
              onChange={(e) => setSadeceHatali(e.target.checked)}
              className="w-4 h-4"
            />
            Sadece hatalı
          </label>

          <label className="flex items-center gap-1.5 text-sm cursor-pointer min-h-[44px] px-2">
            <input
              type="checkbox"
              checked={sadecGecikmiş}
              onChange={(e) => setSadeceGecikmiş(e.target.checked)}
              className="w-4 h-4"
            />
            Gecikmiş
          </label>

          {(arama || durumFiltre || ilFiltre || temsilciFiltre || sadecHatali || sadecGecikmiş) && (
            <button
              onClick={() => {
                setArama(''); setDurumFiltre(''); setIlFiltre('')
                setTemsilciFiltre(''); setSadeceHatali(false); setSadeceGecikmiş(false)
              }}
              className="text-sm text-[#6B7785] hover:text-[#B3261E] min-h-[44px] px-2"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {/* Tablo */}
      <div className="p-4 md:p-6">
        {isLoading && (
          <div className="text-center py-16 text-[#6B7785]">Yükleniyor…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-[#B3261E]/20 rounded p-4 text-sm text-[#B3261E]" role="alert">
            Projeler yüklenemedi. Sayfayı yenileyin.
          </div>
        )}

        {!isLoading && !error && filtrelenmis.length === 0 && (
          <EmptyState
            baslik="Proje bulunamadı"
            aciklama={arama ? 'Arama kriterlerinizle eşleşen proje yok.' : 'Henüz proje eklenmedi. İlk projeyi ekleyerek başlayın.'}
            eylem={
              rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu']) && !arama ? (
                <Button variant="primary" onClick={() => navigate('/projeler/yeni')}>
                  + Yeni proje ekle
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading && filtrelenmis.length > 0 && (
          <div className="table-scroll">
            <table className="w-full border-collapse" aria-label="Proje listesi">
              <thead>
                <tr className="border-b border-[#D6DCE3]">
                  <Th onClick={() => toggleSiralama('proje_kodu')} sorted={siralama === 'proje_kodu'} yon={siralamaYon}>
                    Kod
                  </Th>
                  <Th onClick={() => toggleSiralama('proje_adi')} sorted={siralama === 'proje_adi'} yon={siralamaYon}>
                    Proje
                  </Th>
                  <th className="th-style text-left">Kurum</th>
                  <th className="th-style text-left">İl</th>
                  <th className="th-style text-center">Blok</th>
                  <th className="th-style text-left">Saha İlerlemesi</th>
                  <th className="th-style text-left">Durum</th>
                  <th className="th-style text-left">Temsilci</th>
                  <Th onClick={() => toggleSiralama('hedef_teslim_tarihi')} sorted={siralama === 'hedef_teslim_tarihi'} yon={siralamaYon}>
                    Hedef Tarih
                  </Th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmis.map((proje) => (
                  <ProjeRow key={proje.id} proje={proje} onClick={() => navigate(`/projeler/${proje.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .th-style {
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #6B7785;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

function Th({
  children,
  onClick,
  sorted,
  yon,
}: {
  children: React.ReactNode
  onClick: () => void
  sorted: boolean
  yon: 'asc' | 'desc'
}) {
  return (
    <th className="th-style">
      <button
        onClick={onClick}
        className="flex items-center gap-1 hover:text-[#0F1F33] transition-colors"
        aria-sort={sorted ? (yon === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {children}
        <span aria-hidden className={sorted ? 'text-[#B4531F]' : 'opacity-30'}>
          {sorted ? (yon === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}

function ProjeRow({ proje, onClick }: { proje: Proje; onClick: () => void }) {
  const ilerleme = sahaIlerlemeHesapla(proje.bloklar || [])
  const hatalar = acikHataSayisi(proje.bloklar || [])
  const gecikmiş = projeGecikmeMi(proje.hedef_teslim_tarihi, proje.durum as ProjeDurumu)

  return (
    <tr
      className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] cursor-pointer transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${proje.proje_kodu} — ${proje.proje_adi} projesine git`}
    >
      <td className="px-3 py-3">
        <span
          className="text-xs font-mono text-[#1B4B73] font-semibold"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {proje.proje_kodu}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#0F1F33] truncate max-w-48">
            {proje.proje_adi}
          </span>
          {hatalar > 0 && (
            <Badge variant="error" className="flex-shrink-0">
              <span aria-hidden>⚑</span> {hatalar} hata
            </Badge>
          )}
          {gecikmiş && (
            <Badge variant="warning" className="flex-shrink-0">
              <span aria-hidden>⏰</span> Gecikmiş
            </Badge>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-[#6B7785] truncate max-w-36">{proje.firma?.ad || '—'}</td>
      <td className="px-3 py-3 text-sm text-[#6B7785]">{proje.il}</td>
      <td className="px-3 py-3 text-center font-mono text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
        {proje.blok_sayisi}
      </td>
      <td className="px-3 py-3 min-w-32">
        <ProgressBar
          yuzdesi={ilerleme}
          label={`%${ilerleme} tamamlandı`}
          showLabel={true}
        />
      </td>
      <td className="px-3 py-3">
        <ProjeDurumBadge durum={proje.durum as ProjeDurumu} />
      </td>
      <td className="px-3 py-3 text-sm text-[#6B7785]">{proje.satis_temsilcisi?.ad_soyad || '—'}</td>
      <td className="px-3 py-3">
        <span
          className={`text-sm font-mono ${gecikmiş ? 'text-[#9A6700] font-semibold' : 'text-[#6B7785]'}`}
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {formatTarih(proje.hedef_teslim_tarihi)}
        </span>
      </td>
    </tr>
  )
}
