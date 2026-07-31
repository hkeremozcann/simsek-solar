import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import {
  Plus, Download, Filter, X, Search, LayoutList,
  Table2, AlertCircle, Clock, ChevronUp, ChevronDown,
  ChevronsUpDown, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useMvProjeOzet, useKullanicilar } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ProjeDurumBadge, Badge } from '@/components/ui/Badge'
import { TableSkeleton, HataDurumu, BosDurum } from '@/components/common/QueryState'
import { Input, Select } from '@/components/ui/FormField'
import { formatTarih, formatGoreceli, exportCSV, debounce } from '@/lib/utils'
import { TURKIYE_ILLERI, type ProjeDurumu, type MvProjeOzet } from '@/lib/types'
import { SAYFA_BOYUTU } from '@/config/firma'

type GorunumTipi = 'normal' | 'excel'

export default function Projeler() {
  const navigate = useNavigate()
  const { rolKontrol } = useAuth()
  const yazabilir = rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu'])

  // Filtreler
  const [arama, setArama] = useState('')
  const [aramaDebounced, setAramaDebounced] = useState('')
  const [durumFiltre, setDurumFiltre] = useState('')
  const [ilFiltre, setIlFiltre] = useState('')
  const [temsilciFiltre, setTemsilciFiltre] = useState('')
  const [sadecHatali, setSadecHatali] = useState(false)
  const [sadecGecikmiş, setSadecGecikmiş] = useState(false)
  const [filtrePanelAcik, setFiltrePanelAcik] = useState(false)
  const [gorunum, setGorunum] = useState<GorunumTipi>('normal')
  const [sayfa, setSayfa] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'olusturma_tarihi', desc: true }])

  const aramaGuncelle = useCallback(
    debounce((val: string) => { setAramaDebounced(val); setSayfa(0) }, 300),
    []
  )

  function handleArama(val: string) {
    setArama(val)
    aramaGuncelle(val)
  }

  // MV'den veri çek — saha_yuzdesi, dizilim_tamamlanan vb. hesaplanmış alanlar burada
  const { data: tumProjeler = [], isLoading, error, refetch } = useMvProjeOzet({
    durum: durumFiltre || undefined,
    il: ilFiltre || undefined,
    satis_temsilcisi_id: temsilciFiltre || undefined,
  })

  // İstemci tarafı arama ve filtre (MV sunucu tarafı filtre desteklemez)
  const projeler = useMemo(() => {
    let liste = tumProjeler
    if (aramaDebounced) {
      const q = aramaDebounced.toLowerCase()
      liste = liste.filter(p =>
        p.proje_kodu?.toLowerCase().includes(q) ||
        p.proje_adi?.toLowerCase().includes(q) ||
        p.firma_adi?.toLowerCase().includes(q) ||
        p.il?.toLowerCase().includes(q)
      )
    }
    if (sadecHatali) liste = liste.filter(p => p.acik_hata > 0)
    if (sadecGecikmiş) liste = liste.filter(p => p.gecikmis_mi)
    return liste
  }, [tumProjeler, aramaDebounced, sadecHatali, sadecGecikmiş])

  const toplam = projeler.length
  const sayfaSayisi = Math.ceil(toplam / SAYFA_BOYUTU)
  const sayfaProjeler = projeler.slice(sayfa * SAYFA_BOYUTU, (sayfa + 1) * SAYFA_BOYUTU)

  const { data: kullanicilar = [] } = useKullanicilar()
  const temsilciler = kullanicilar.filter(k =>
    ['yonetici', 'satis_sonrasi_sorumlusu', 'satis_temsilcisi'].includes(k.rol)
  )

  const aktifFiltreSayisi = [
    durumFiltre, ilFiltre, temsilciFiltre,
    sadecHatali, sadecGecikmiş
  ].filter(Boolean).length

  function filtreleriTemizle() {
    setDurumFiltre(''); setIlFiltre(''); setTemsilciFiltre('')
    setSadecHatali(false); setSadecGecikmiş(false)
    setArama(''); setAramaDebounced(''); setSayfa(0)
  }

  // TanStack Table kolonları
  const kolonlar = useMemo<ColumnDef<MvProjeOzet>[]>(() => {
    const temel: ColumnDef<MvProjeOzet>[] = [
      {
        id: 'proje_kodu',
        accessorKey: 'proje_kodu',
        header: 'Kod',
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-[#1B4B73] font-semibold whitespace-nowrap"
            style={{ fontFamily: 'IBM Plex Mono' }}>
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'firma',
        accessorFn: (r) => r.firma_adi,
        header: 'Firma',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-[#6B7785] truncate block max-w-36">{getValue<string>() || '—'}</span>
        ),
      },
      {
        id: 'proje_adi',
        accessorKey: 'proje_adi',
        header: 'İş Adı',
        size: 220,
        cell: ({ row, getValue }) => (
          <div className="min-w-0">
            <span className="text-sm font-medium text-[#0F1F33] line-clamp-1">{getValue<string>()}</span>
            {(row.original as { gecikmis_mi?: boolean; hareketsiz_mi?: boolean }).gecikmis_mi && (
              <Badge variant="warning" className="mt-0.5">
                <Clock size={9} aria-hidden /> Gecikmiş
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'il',
        accessorKey: 'il',
        header: 'İl',
        size: 90,
        cell: ({ row, getValue }) => (
          <span className="text-sm text-[#6B7785]">
            {getValue<string>()}
            {row.original.ilce ? <span className="text-xs"> / {row.original.ilce}</span> : null}
          </span>
        ),
      },
      {
        id: 'konut_sayisi',
        accessorKey: 'konut_sayisi',
        header: 'Konut',
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular text-sm text-right block"
            style={{ fontFamily: 'IBM Plex Mono' }}>
            {getValue<number>()?.toLocaleString('tr-TR') || '—'}
          </span>
        ),
      },
      {
        id: 'blok_sayisi',
        accessorKey: 'blok_sayisi',
        header: 'Blok',
        size: 70,
        cell: ({ getValue }) => (
          <span className="tabular text-sm text-center block"
            style={{ fontFamily: 'IBM Plex Mono' }}>
            {getValue<number>()}
          </span>
        ),
      },
      {
        id: 'saha_yuzdesi',
        accessorFn: (r) => r.saha_yuzdesi ?? 0,
        header: 'Saha %',
        size: 90,
        cell: ({ getValue }) => {
          const pct = getValue<number>()
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#D6DCE3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct === 100 ? '#1B7A4B' : '#B4531F',
                  }}
                />
              </div>
              <span className="text-xs font-mono flex-shrink-0" style={{ fontFamily: 'IBM Plex Mono' }}>
                %{pct}
              </span>
            </div>
          )
        },
      },
      {
        id: 'acik_hata',
        accessorFn: (r) => r.acik_hata ?? 0,
        header: 'Hata',
        size: 70,
        cell: ({ getValue }) => {
          const n = getValue<number>()
          return n > 0 ? (
            <Badge variant="error" className="justify-center w-full">
              <AlertCircle size={10} aria-hidden /> {n}
            </Badge>
          ) : <span className="text-xs text-[#D6DCE3] text-center block">—</span>
        },
      },
      {
        id: 'durum',
        accessorKey: 'durum',
        header: 'Durum',
        size: 120,
        cell: ({ row }) => (
          <ProjeDurumBadge
            durum={row.original.durum as ProjeDurumu}
            gecikmisMi={(row.original as { gecikmis_mi?: boolean }).gecikmis_mi}
          />
        ),
      },
      {
        id: 'satis_temsilcisi',
        accessorFn: (r) => r.satis_temsilcisi_adi,
        header: 'Temsilci',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-xs text-[#6B7785] truncate block">{getValue<string>() || '—'}</span>
        ),
      },
      // ─── Aşama sütunları (8/12 + ince çubuk, kapsam dışıysa –) ───
      {
        id: 'asama_dizilim',
        header: 'Dizilim',
        size: 76,
        accessorKey: 'id',
        cell: ({ row }) => <AsamaHucresi proje={row.original as MvProjeOzet} kapsam="Panel Dizilim Montajı" alanAdi="dizilim_tamamlanan" />,
      },
      {
        id: 'asama_borulama',
        header: 'Borulama',
        size: 76,
        accessorKey: 'proje_kodu',
        cell: ({ row }) => <AsamaHucresi proje={row.original as MvProjeOzet} kapsam="Borulama Montajı" alanAdi="borulama_tamamlanan" />,
      },
      {
        id: 'asama_pano',
        header: 'Pano',
        size: 76,
        accessorKey: 'proje_adi',
        cell: ({ row }) => <AsamaHucresi proje={row.original as MvProjeOzet} kapsam="Pano Montajı" alanAdi="pano_tamamlanan" />,
      },
      {
        id: 'asama_devre',
        header: 'Devreye',
        size: 76,
        accessorKey: 'firma_id',
        cell: ({ row }) => <AsamaHucresi proje={row.original as MvProjeOzet} kapsam="Devreye Alma" alanAdi="devreye_alinan_blok" />,
      },
      {
        id: 'son_hareket_tarihi',
        accessorKey: 'son_hareket_tarihi',
        header: 'Son Hareket',
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-xs text-[#6B7785] font-mono whitespace-nowrap"
            style={{ fontFamily: 'IBM Plex Mono' }}>
            {formatGoreceli(getValue<string>())}
          </span>
        ),
      },
    ]

    // Excel görünümünde ekstra kolonlar
    if (gorunum === 'excel') {
      temel.push(
        {
          id: 'olusturma_tarihi',
          accessorKey: 'olusturma_tarihi',
          header: 'Kayıt Tarihi',
          size: 100,
          cell: ({ getValue }) => (
            <span className="text-xs font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
              {formatTarih(getValue<string>())}
            </span>
          ),
        },
        {
          id: 'hedef_teslim',
          accessorKey: 'hedef_teslim_tarihi',
          header: 'Hedef Teslim',
          size: 100,
          cell: ({ getValue }) => (
            <span className="text-xs font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
              {formatTarih(getValue<string>())}
            </span>
          ),
        },
        {
          id: 'sozlesme_no',
          accessorKey: 'sozlesme_no',
          header: 'Sözleşme No',
          size: 120,
          cell: ({ getValue }) => <span className="text-xs text-[#6B7785]">{getValue<string>() || '—'}</span>,
        },
        {
          id: 'sistem_tipi',
          accessorKey: 'sistem_tipi',
          header: 'Sistem',
          size: 100,
          cell: ({ getValue }) => <span className="text-xs text-[#6B7785]">{getValue<string>() || '—'}</span>,
        }
      )
    }

    return temel
  }, [gorunum])

  const tablo = useReactTable({
    data: sayfaProjeler,
    columns: kolonlar as ColumnDef<MvProjeOzet>[],
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: sayfaSayisi,
  })

  function exportExcel() {
    const basliklar = ['Sıra', 'Proje Kodu', 'Firma', 'İş Adı', 'İl', 'İlçe', 'Konut', 'Blok',
      'Saha %', 'Açık Hata', 'Durum', 'Temsilci', 'Son Hareket']
    const satirlar = projeler.map((p, i) => [
      String(i + 1 + sayfa * SAYFA_BOYUTU),
      p.proje_kodu,
      p.firma?.ad || '',
      p.proje_adi,
      p.il,
      p.ilce || '',
      String((p as { konut_sayisi?: number }).konut_sayisi || 0),
      String(p.blok_sayisi),
      String((p as { saha_yuzdesi?: number }).saha_yuzdesi ?? 0),
      String((p as { acik_hata?: number }).acik_hata ?? 0),
      p.durum,
      p.satis_temsilcisi_adi || '',
      formatTarih(p.son_hareket_tarihi),
    ])
    exportCSV([basliklar, ...satirlar], `projeler-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <PageHeader
        baslik={`Projeler${toplam > 0 ? ` (${toplam.toLocaleString('tr-TR')})` : ''}`}
        aciklama={isLoading ? 'Yükleniyor…' : `${toplam.toLocaleString('tr-TR')} proje`}
        eylemler={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={exportExcel}>
              CSV
            </Button>
            {yazabilir && (
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}
                onClick={() => navigate('/projeler/yeni')}>
                Yeni proje
              </Button>
            )}
          </div>
        }
      />

      {/* ── Filtre çubuğu ── */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-2.5 sticky top-0 z-20">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Arama */}
          <div className="relative min-w-48 flex-1 max-w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7785]" aria-hidden />
            <Input
              value={arama}
              onChange={(e) => handleArama(e.target.value)}
              placeholder="Kod, firma, iş adı, il…"
              className="pl-8 h-9 text-sm"
              aria-label="Proje ara"
            />
            {arama && (
              <button onClick={() => handleArama('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7785] hover:text-[#B3261E]">
                <X size={13} aria-label="Aramayı temizle" />
              </button>
            )}
          </div>

          {/* Durum */}
          <Select value={durumFiltre} onChange={(e) => { setDurumFiltre(e.target.value); setSayfa(0) }}
            className="h-9 text-sm w-36" aria-label="Durum filtresi">
            <option value="">Tüm durumlar</option>
            <option>Çalışıyor</option>
            <option>Beklemede</option>
            <option>Tamamlandı</option>
            <option>İptal</option>
          </Select>

          {/* Filtreler paneli */}
          <button
            onClick={() => setFiltrePanelAcik(f => !f)}
            className={`h-9 px-3 text-sm rounded border flex items-center gap-1.5 transition-colors ${
              aktifFiltreSayisi > 0
                ? 'border-[#B4531F] bg-[#B4531F]/5 text-[#B4531F]'
                : 'border-[#D6DCE3] text-[#6B7785] hover:border-[#6B7785]'
            }`}
          >
            <Filter size={13} aria-hidden />
            Filtreler
            {aktifFiltreSayisi > 0 && (
              <span className="bg-[#B4531F] text-white text-[10px] rounded-full px-1.5 min-w-[18px] text-center">
                {aktifFiltreSayisi}
              </span>
            )}
          </button>

          {/* Görünüm toggle */}
          <div className="flex border border-[#D6DCE3] rounded overflow-hidden ml-auto">
            <button
              onClick={() => setGorunum('normal')}
              className={`h-9 px-2.5 text-xs flex items-center gap-1 transition-colors ${
                gorunum === 'normal' ? 'bg-[#0F1F33] text-white' : 'text-[#6B7785] hover:bg-[#F5F7F9]'
              }`}
              title="Normal görünüm"
            >
              <LayoutList size={14} aria-hidden />
            </button>
            <button
              onClick={() => setGorunum('excel')}
              className={`h-9 px-2.5 text-xs flex items-center gap-1 transition-colors border-l border-[#D6DCE3] ${
                gorunum === 'excel' ? 'bg-[#0F1F33] text-white' : 'text-[#6B7785] hover:bg-[#F5F7F9]'
              }`}
              title="Excel görünümü"
            >
              <Table2 size={14} aria-hidden />
              <span className="hidden sm:inline text-xs">Excel</span>
            </button>
          </div>

          {aktifFiltreSayisi > 0 && (
            <button onClick={filtreleriTemizle}
              className="text-xs text-[#6B7785] hover:text-[#B3261E] flex items-center gap-1 min-h-[36px] px-1">
              <X size={12} aria-hidden /> Temizle
            </button>
          )}
        </div>

        {/* Açılır filtre paneli */}
        {filtrePanelAcik && (
          <div className="mt-2 pt-2 border-t border-[#D6DCE3] flex flex-wrap gap-2">
            <Select value={ilFiltre} onChange={(e) => { setIlFiltre(e.target.value); setSayfa(0) }}
              className="h-9 text-sm w-36" aria-label="İl filtresi">
              <option value="">Tüm iller</option>
              {TURKIYE_ILLERI.sort().map(il => <option key={il} value={il}>{il}</option>)}
            </Select>
            <Select value={temsilciFiltre} onChange={(e) => { setTemsilciFiltre(e.target.value); setSayfa(0) }}
              className="h-9 text-sm w-44" aria-label="Temsilci filtresi">
              <option value="">Tüm temsilciler</option>
              {temsilciler.map(k => <option key={k.id} value={k.id}>{k.ad_soyad}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm cursor-pointer h-9 px-2 border border-[#D6DCE3] rounded">
              <input type="checkbox" checked={sadecHatali}
                onChange={e => { setSadecHatali(e.target.checked); setSayfa(0) }} className="w-4 h-4" />
              Sadece hatalı
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer h-9 px-2 border border-[#D6DCE3] rounded">
              <input type="checkbox" checked={sadecGecikmiş}
                onChange={e => { setSadecGecikmiş(e.target.checked); setSayfa(0) }} className="w-4 h-4" />
              Gecikmiş
            </label>
          </div>
        )}
      </div>

      {/* ── Tablo ── */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><TableSkeleton satirSayisi={8} sutunSayisi={8} /></div>
        ) : error ? (
          <div className="p-4"><HataDurumu hata={error as Error} tekrarDene={refetch} /></div>
        ) : projeler.length === 0 ? (
          <BosDurum
            baslik={aramaDebounced || aktifFiltreSayisi > 0
              ? 'Bu filtrelerle eşleşen proje yok'
              : 'Henüz proje eklenmedi'}
            aciklama={aramaDebounced || aktifFiltreSayisi > 0
              ? undefined
              : 'İlk projeyi ekleyerek başlayın.'}
            eylem={
              aktifFiltreSayisi > 0 ? (
                <Button variant="outline" size="sm" onClick={filtreleriTemizle}>
                  Filtreleri temizle
                </Button>
              ) : yazabilir ? (
                <Button variant="primary" leftIcon={<Plus size={14} />}
                  onClick={() => navigate('/projeler/yeni')}>
                  İlk projeyi oluştur
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-scroll h-full" role="region" aria-label="Proje listesi">
            <table className="data-table w-full" aria-label={`${toplam} proje`}>
              <thead>
                {tablo.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => (
                      <th
                        key={header.id}
                        scope="col"
                        style={{ width: header.getSize() }}
                        className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide whitespace-nowrap border-b border-[#D6DCE3] bg-white"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            className="flex items-center gap-1 hover:text-[#0F1F33] transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                            aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending'
                              : header.column.getIsSorted() === 'desc' ? 'descending' : 'none'}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp size={12} className="text-[#B4531F]" aria-hidden />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown size={12} className="text-[#B4531F]" aria-hidden />
                            ) : (
                              <ChevronsUpDown size={12} className="opacity-30" aria-hidden />
                            )}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {tablo.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] cursor-pointer transition-colors"
                    onClick={() => navigate(`/projeler/${row.original.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/projeler/${row.original.id}`)}
                    aria-label={`${row.original.proje_kodu} — ${row.original.proje_adi}`}
                    style={{ height: 40 }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sayfalama ── */}
      {toplam > SAYFA_BOYUTU && (
        <div className="bg-white border-t border-[#D6DCE3] px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-[#6B7785] font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
            {(sayfa * SAYFA_BOYUTU + 1).toLocaleString('tr-TR')}–
            {Math.min((sayfa + 1) * SAYFA_BOYUTU, toplam).toLocaleString('tr-TR')}
            {' '}/{' '}{toplam.toLocaleString('tr-TR')}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSayfa(p => Math.max(0, p - 1))}
              disabled={sayfa === 0}
              className="p-2 rounded hover:bg-[#F5F7F9] disabled:opacity-30 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Önceki sayfa"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <span className="text-sm text-[#6B7785] min-w-[80px] text-center">
              {sayfa + 1} / {sayfaSayisi}
            </span>
            <button
              onClick={() => setSayfa(p => Math.min(sayfaSayisi - 1, p + 1))}
              disabled={sayfa >= sayfaSayisi - 1}
              className="p-2 rounded hover:bg-[#F5F7F9] disabled:opacity-30 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Sonraki sayfa"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// ─── Aşama hücresi bileşeni ───────────────────────────────────
function AsamaHucresi({ proje, kapsam, alanAdi }: {
  proje: MvProjeOzet; kapsam: string; alanAdi: keyof MvProjeOzet
}) {
  if (!proje.montaj_kapsami?.includes(kapsam)) {
    return <span className="text-xs text-[#D6DCE3] text-center block">—</span>
  }
  const tamamlanan = (proje[alanAdi] as number) ?? 0
  const toplam = proje.blok_sayisi || 0
  const pct = toplam > 0 ? Math.floor((tamamlanan / toplam) * 100) : 0
  return (
    <div className="text-center">
      <span className="text-xs font-mono block leading-tight" style={{ fontFamily: 'IBM Plex Mono' }}>
        {tamamlanan}/{toplam}
      </span>
      <div className="h-1 bg-[#D6DCE3] rounded-full overflow-hidden mt-0.5 mx-1">
        <div className="h-full rounded-full" style={{
          width: `${pct}%`,
          backgroundColor: pct === 100 ? '#1B7A4B' : '#B4531F',
        }} />
      </div>
    </div>
  )
}
