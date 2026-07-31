import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, FileText, Grid3X3, Pipette,
  CircuitBoard, Zap, AlertCircle, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useMvProjeOzet, useAktiviteLogu, useAylikBlokVerisi } from '@/hooks/useProjects'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton, TableSkeleton, HataDurumu } from '@/components/common/QueryState'
import { formatGoreceli, formatSayi } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { MvProjeOzet } from '@/lib/types'

// ─── Portföy istatistikleri sorgusu ──────────────────────────
function usePortfoyStats() {
  return useQuery({
    queryKey: ['portfoy-stats'],
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data: projeler } = await supabase
        .from('mv_proje_ozet').select('*')

      if (!projeler) return null

      const tumProjeler = projeler as MvProjeOzet[]
      const toplamBlok = tumProjeler.reduce((s, p) => s + (p.blok_sayisi || 0), 0)

      // Aşama bazında tamamlanan blok sayıları (projeler.mv_proje_ozet'ten)
      const dizilimKapsam = tumProjeler.filter(p =>
        (p as { montaj_kapsami?: string[] }).montaj_kapsami?.includes('Panel Dizilim Montajı')
      )
      const borulamaKapsam = tumProjeler.filter(p =>
        (p as { montaj_kapsami?: string[] }).montaj_kapsami?.includes('Borulama Montajı')
      )
      const panoKapsam = tumProjeler.filter(p =>
        (p as { montaj_kapsami?: string[] }).montaj_kapsami?.includes('Pano Montajı')
      )
      const devreKapsam = tumProjeler.filter(p =>
        (p as { montaj_kapsami?: string[] }).montaj_kapsami?.includes('Devreye Alma')
      )
      const cizimKapsam = tumProjeler.filter(p =>
        (p as { montaj_kapsami?: string[] }).montaj_kapsami?.includes('Proje Desteği')
      )

      // Aşama bazında blok sayıları (veritabanından)
      const [kaide, dizilim, borulama, pano, devre] = await Promise.all([
        supabase.from('blok_asamalari').select('id', { count: 'exact', head: true })
          .eq('asama_tipi', 'Kaide Kontrolü').eq('durum', 'Tamamlandı').eq('sonuc', 'Uygun'),
        supabase.from('blok_asamalari').select('id', { count: 'exact', head: true })
          .eq('asama_tipi', 'Dizilim').eq('durum', 'Tamamlandı').eq('sonuc', 'Uygun'),
        supabase.from('blok_asamalari').select('id', { count: 'exact', head: true })
          .eq('asama_tipi', 'Borulama').eq('durum', 'Tamamlandı').eq('sonuc', 'Uygun'),
        supabase.from('blok_asamalari').select('id', { count: 'exact', head: true })
          .eq('asama_tipi', 'Pano Bağlantısı').eq('durum', 'Tamamlandı').eq('sonuc', 'Uygun'),
        supabase.from('blok_asamalari').select('id', { count: 'exact', head: true })
          .eq('asama_tipi', 'Devreye Alma').eq('durum', 'Tamamlandı').eq('sonuc', 'Uygun'),
      ])

      // Toplam kollektör (proje_malzemeleri'nden)
      const { data: kollektor } = await supabase
        .from('proje_malzemeleri')
        .select('sozlesme_adedi, malzeme_id, malzemeler!inner(kategori)')
        .eq('malzemeler.kategori', 'Kollektör')

      const toplamKollektor = (kollektor || []).reduce((s: number, r: { sozlesme_adedi: number }) => s + (r.sozlesme_adedi || 0), 0)

      const acikHata = tumProjeler.reduce((s, p) => s + (p.acik_hata || 0), 0)
      const hataliPrjSay = tumProjeler.filter(p => p.acik_hata > 0).length

      // Doküman istatistikleri (Proje Çizimi kutusu için)
      const { data: dokumanlar } = await supabase
        .from('proje_dokumanlari')
        .select('dokuman_tipi, durum')

      const dokumanStats = {
        kaide:    { toplam: 0, tamamlanan: 0 },
        borulama: { toplam: 0, tamamlanan: 0 },
        uygulama: { toplam: 0, tamamlanan: 0 },
      };
      (dokumanlar || []).forEach(d => {
        const tamamlandi = d.durum === 'Tamamlandı' || d.durum === 'Onaylandı' || d.durum === 'Müşteriye Gönderildi'
        if (d.dokuman_tipi === 'Kaide Projesi') {
          dokumanStats.kaide.toplam++
          if (tamamlandi) dokumanStats.kaide.tamamlanan++
        } else if (d.dokuman_tipi === 'Borulama Projesi') {
          dokumanStats.borulama.toplam++
          if (tamamlandi) dokumanStats.borulama.tamamlanan++
        } else if (d.dokuman_tipi === 'Uygulama Projesi') {
          dokumanStats.uygulama.toplam++
          if (tamamlandi) dokumanStats.uygulama.tamamlanan++
        }
      })

      return {
        toplamBlok,
        toplamKollektor,
        aktifProje: tumProjeler.filter(p => p.aktif_mi && p.durum === 'Çalışıyor').length,
        tamamlananProje: tumProjeler.filter(p => p.durum === 'Tamamlandı').length,
        toplamProje: tumProjeler.length,
        // Aşama bazında
        dizilim: {
          kapsamPrj: dizilimKapsam.length,
          kapsamBlok: dizilimKapsam.reduce((s, p) => s + (p.blok_sayisi || 0), 0),
          tamamlanan: dizilim.count ?? 0,
        },
        borulama: {
          kapsamPrj: borulamaKapsam.length,
          kapsamBlok: borulamaKapsam.reduce((s, p) => s + (p.blok_sayisi || 0), 0),
          tamamlanan: borulama.count ?? 0,
        },
        pano: {
          kapsamPrj: panoKapsam.length,
          kapsamBlok: panoKapsam.reduce((s, p) => s + (p.blok_sayisi || 0), 0),
          tamamlanan: pano.count ?? 0,
        },
        devre: {
          kapsamPrj: devreKapsam.length,
          kapsamBlok: devreKapsam.reduce((s, p) => s + (p.blok_sayisi || 0), 0),
          tamamlanan: devre.count ?? 0,
        },
        cizim: {
          kapsamPrj: cizimKapsam.length,
          dokumanStats,
        },
        acikHata,
        hataliPrjSay,
      }
    },
  })
}

export default function Panel() {
  const navigate = useNavigate()
  const { kullanici } = useAuth()
  const { data: projeler = [], isLoading: prjYuk, error: prjHata, refetch: prjYenile } = useMvProjeOzet()
  const { data: aktiviteler = [] } = useAktiviteLogu(undefined, 15)
  const { data: aylikVeri = [] } = useAylikBlokVerisi()
  const { data: stats, isLoading: statsYuk } = usePortfoyStats()

  const aktifProjeler = projeler.filter(p => p.aktif_mi && p.durum === 'Çalışıyor')
  const dikkat = projeler
    .filter(p => p.acik_hata > 0 || p.gecikmis_mi || p.hareketsiz_mi)
    .sort((a, b) => b.acik_hata - a.acik_hata || Number(b.gecikmis_mi) - Number(a.gecikmis_mi))
    .slice(0, 8)

  const kurumDagilim = useMemo(() => {
    const map: Record<string, number> = {}
    projeler.forEach(p => {
      const k = p.kurum_tipi || 'Diğer'
      map[k] = (map[k] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [projeler])

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Kontrol paneli"
        aciklama={`Hoş geldiniz, ${kullanici?.ad_soyad?.split(' ')[0] || ''}`}
        eylemler={
          <Button variant="primary" size="sm"
            leftIcon={<FolderKanban size={14} />}
            onClick={() => navigate('/projeler/yeni')}>
            Yeni proje
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-6">

        {/* ── 7 Takip Kutusu ─────────────────────────────────── */}
        <section aria-labelledby="ozet-baslik">
          <h2 id="ozet-baslik" className="sr-only">Portföy özeti</h2>
          {statsYuk ? <CardSkeleton sayi={7} /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">

              {/* Aktif */}
              <TakipKutusu
                baslik="Aktif"
                Ikon={FolderKanban}
                renk="#1B4B73"
                projeAdet={stats?.aktifProje ?? 0}
                toplamProje={stats?.toplamProje ?? 0}
                serit={`${formatSayi(stats?.toplamBlok ?? 0)} blok`}
                tikla={() => navigate('/projeler?durum=Çalışıyor')}
              />

              {/* Proje Çizimi — doküman bazlı */}
              <ProjecizimiKutusu
                kapsamPrj={stats?.cizim.kapsamPrj ?? 0}
                dokumanStats={stats?.cizim.dokumanStats}
                tikla={() => navigate('/projeler?kapsam=Proje+Desteği')}
              />

              {/* Dizilim */}
              <AsamaKutusu
                baslik="Dizilim"
                Ikon={Grid3X3}
                renk="#B4531F"
                tamamlanan={stats?.dizilim.tamamlanan ?? 0}
                kapsamBlok={stats?.dizilim.kapsamBlok ?? 0}
                toplamBlok={stats?.toplamBlok ?? 0}
                kapsamPrj={stats?.dizilim.kapsamPrj ?? 0}
                tikla={() => navigate('/projeler?kapsam=Panel+Dizilim+Montajı')}
              />

              {/* Borulama */}
              <AsamaKutusu
                baslik="Borulama"
                Ikon={Pipette}
                renk="#1B4B73"
                tamamlanan={stats?.borulama.tamamlanan ?? 0}
                kapsamBlok={stats?.borulama.kapsamBlok ?? 0}
                toplamBlok={stats?.toplamBlok ?? 0}
                kapsamPrj={stats?.borulama.kapsamPrj ?? 0}
                tikla={() => navigate('/projeler?kapsam=Borulama+Montajı')}
              />

              {/* Pano */}
              <AsamaKutusu
                baslik="Pano"
                Ikon={CircuitBoard}
                renk="#1B4B73"
                tamamlanan={stats?.pano.tamamlanan ?? 0}
                kapsamBlok={stats?.pano.kapsamBlok ?? 0}
                toplamBlok={stats?.toplamBlok ?? 0}
                kapsamPrj={stats?.pano.kapsamPrj ?? 0}
                tikla={() => navigate('/projeler?kapsam=Pano+Montajı')}
              />

              {/* Devreye Alım */}
              <AsamaKutusu
                baslik="Devreye Alım"
                Ikon={Zap}
                renk="#1B7A4B"
                tamamlanan={stats?.devre.tamamlanan ?? 0}
                kapsamBlok={stats?.devre.kapsamBlok ?? 0}
                toplamBlok={stats?.toplamBlok ?? 0}
                kapsamPrj={stats?.devre.kapsamPrj ?? 0}
                tikla={() => navigate('/projeler?kapsam=Devreye+Alma')}
                vurgulu
              />

              {/* Hatalı */}
              <TakipKutusu
                baslik="Hatalı"
                Ikon={AlertCircle}
                renk={stats?.acikHata ? '#B3261E' : '#6B7785'}
                projeAdet={stats?.hataliPrjSay ?? 0}
                toplamProje={stats?.toplamProje ?? 0}
                serit={`${formatSayi(stats?.acikHata ?? 0)} açık hata`}
                tikla={() => navigate('/hatalar')}
                uyari={!!(stats?.acikHata)}
              />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Dikkat listesi */}
            {dikkat.length > 0 && (
              <Card padding="none">
                <CardHeader title="Dikkat gerektiriyor"
                  subtitle={`${dikkat.length} proje önlem bekliyor`}
                  className="px-4 pt-4 pb-0"
                  action={
                    <button onClick={() => navigate('/hatalar')}
                      className="text-xs text-[#1B4B73] hover:underline flex items-center gap-1">
                      Tüm hatalar <ChevronRight size={13} />
                    </button>
                  }
                />
                <ul className="divide-y divide-[#D6DCE3] mt-3">
                  {dikkat.map(p => (
                    <li key={p.id}>
                      <button
                        onClick={() => navigate(`/projeler/${p.id}`)}
                        className="w-full text-left px-4 py-3 hover:bg-[#F5F7F9] transition-colors flex items-center justify-between gap-3 min-h-[52px]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[#1B4B73] font-semibold flex-shrink-0"
                              style={{ fontFamily: 'IBM Plex Mono' }}>
                              {p.proje_kodu}
                            </span>
                            <span className="text-sm font-medium text-[#0F1F33] truncate">{p.proje_adi}</span>
                          </div>
                          <div className="flex gap-1.5 mt-0.5 flex-wrap">
                            {p.acik_hata > 0 && (
                              <Badge variant="error">
                                <AlertCircle size={10} aria-hidden /> {p.acik_hata} hata
                              </Badge>
                            )}
                            {p.gecikmis_mi && <Badge variant="warning">Gecikmiş</Badge>}
                            {p.hareketsiz_mi && <Badge variant="neutral">Hareketsiz</Badge>}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#D6DCE3] flex-shrink-0" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Devam eden projeler */}
            <Card padding="none">
              <CardHeader
                title="Devam eden projeler"
                subtitle={`${aktifProjeler.length} aktif proje`}
                className="px-4 pt-4 pb-0"
                action={<Button variant="ghost" size="sm" onClick={() => navigate('/projeler')}>Tümünü gör</Button>}
              />
              {prjYuk ? (
                <div className="mt-3"><TableSkeleton satirSayisi={5} sutunSayisi={3} /></div>
              ) : prjHata ? (
                <HataDurumu hata={prjHata as Error} tekrarDene={prjYenile} />
              ) : aktifProjeler.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[#6B7785] mb-3">Aktif proje yok.</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/projeler/yeni')}>
                    İlk projeyi oluştur
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-[#D6DCE3] mt-3">
                  {aktifProjeler.slice(0, 8).map(p => {
                    const pct = p.saha_yuzdesi ?? 0
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => navigate(`/projeler/${p.id}`)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#F5F7F9] transition-colors min-h-[52px]">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-mono text-[#1B4B73] font-semibold flex-shrink-0"
                                style={{ fontFamily: 'IBM Plex Mono' }}>{p.proje_kodu}</span>
                              <span className="text-sm font-medium text-[#0F1F33] truncate">{p.proje_adi}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {p.acik_hata > 0 && (
                                <Badge variant="error">
                                  <AlertCircle size={9} aria-hidden /> {p.acik_hata}
                                </Badge>
                              )}
                              <span className="text-xs font-mono text-[#6B7785]"
                                style={{ fontFamily: 'IBM Plex Mono' }}>%{pct}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-[#D6DCE3] rounded-full overflow-hidden"
                            role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#1B7A4B' : '#B4531F' }} />
                          </div>
                          <p className="text-xs text-[#6B7785] mt-1">
                            {p.il} · {p.blok_sayisi} blok · {p.kurum_tipi || p.firma_adi}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            {/* Aylık blok grafiği */}
            <Card>
              <CardHeader title="Aylık devreye alınan blok"
                subtitle="Son 12 ay — çubuk: aylık, çizgi: kümülatif" />
              {aylikVeri.length === 0 ? (
                <p className="text-sm text-[#6B7785] py-4 text-center">Henüz devreye alınan blok yok.</p>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aylikVeri} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D6DCE3" vertical={false} />
                      <XAxis dataKey="ay" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#6B7785' }} />
                      <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#6B7785' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontFamily: 'IBM Plex Sans', fontSize: 12, border: '1px solid #D6DCE3', borderRadius: 4 }}
                        labelFormatter={(l) => l} />
                      <Bar dataKey="sayi" fill="#B4531F" radius={[2,2,0,0]} name="Aylık" />
                      <Line type="monotone" dataKey="kumulatif" stroke="#1B4B73" strokeWidth={2} dot={false} name="Kümülatif" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Sağ sütun */}
          <div className="space-y-6">
            {/* Kurum dağılımı */}
            <Card>
              <CardHeader title="Kurum dağılımı" />
              {kurumDagilim.length === 0 ? (
                <p className="text-sm text-[#6B7785]">Henüz veri yok.</p>
              ) : (
                <ul className="space-y-2.5">
                  {kurumDagilim.map(([tip, sayi]) => {
                    const max = kurumDagilim[0]?.[1] || 1
                    return (
                      <li key={tip}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[#0F1F33] truncate">{tip}</span>
                          <span className="font-mono text-[#6B7785] flex-shrink-0 ml-2"
                            style={{ fontFamily: 'IBM Plex Mono' }}>{sayi}</span>
                        </div>
                        <div className="h-1.5 bg-[#D6DCE3] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1B4B73] rounded-full"
                            style={{ width: `${(sayi / max) * 100}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            {/* Son aktiviteler */}
            <Card padding="none">
              <CardHeader title="Son aktiviteler" className="px-4 pt-4 pb-0" />
              {aktiviteler.length === 0 ? (
                <p className="text-sm text-[#6B7785] px-4 py-4">Henüz aktivite yok.</p>
              ) : (
                <ul className="divide-y divide-[#D6DCE3] mt-2">
                  {aktiviteler.slice(0, 12).map((a: {
                    id: string; islem: string; tablo: string; yeni_deger?: string; tarih: string
                    kullanici?: { ad_soyad: string } | null
                  }) => (
                    <li key={a.id} className="px-4 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#0F1F33] truncate">
                            {a.kullanici?.ad_soyad || 'Sistem'}
                          </p>
                          <p className="text-xs text-[#6B7785] truncate">
                            {islemMesg(a.islem, a.tablo, a.yeni_deger)}
                          </p>
                        </div>
                        <time className="text-[10px] text-[#6B7785] flex-shrink-0 font-mono"
                          dateTime={a.tarih} style={{ fontFamily: 'IBM Plex Mono' }}>
                          {formatGoreceli(a.tarih)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Takip kutusu (Aktif / Çizim / Hatalı) ───────────────────
// ─── Proje Çizimi kutusu (doküman istatistikleri) ─────────────
interface DokumanStat { toplam: number; tamamlanan: number }

function ProjecizimiKutusu({ kapsamPrj, dokumanStats, tikla }: {
  kapsamPrj: number
  dokumanStats?: { kaide: DokumanStat; borulama: DokumanStat; uygulama: DokumanStat }
  tikla?: () => void
}) {
  const satirlar = [
    { ad: 'Kaide', stat: dokumanStats?.kaide },
    { ad: 'Borulama', stat: dokumanStats?.borulama },
    { ad: 'Uygulama', stat: dokumanStats?.uygulama },
  ]
  const toplamToplam = (dokumanStats?.kaide.toplam ?? 0) + (dokumanStats?.borulama.toplam ?? 0) + (dokumanStats?.uygulama.toplam ?? 0)
  const toplamTamamlanan = (dokumanStats?.kaide.tamamlanan ?? 0) + (dokumanStats?.borulama.tamamlanan ?? 0) + (dokumanStats?.uygulama.tamamlanan ?? 0)
  const genelPct = toplamToplam > 0 ? Math.floor((toplamTamamlanan / toplamToplam) * 100) : 0

  const Tag = tikla ? 'button' : 'div'
  return (
    <Tag onClick={tikla}
      className={`bg-white border border-[#D6DCE3] rounded p-2.5 text-left w-full ${tikla ? 'hover:border-[#1B4B73]/40 cursor-pointer' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <FileText size={13} className="text-[#6B7785]" aria-hidden />
        <span className="text-xs text-[#6B7785] font-medium">Proje Çizimi</span>
      </div>
      <p className="text-2xl font-bold text-[#0F1F33] tabular leading-none"
        style={{ fontFamily: 'IBM Plex Mono' }}>{kapsamPrj}</p>
      <p className="text-xs font-mono mt-0.5 text-[#6B7785]"
        style={{ fontFamily: 'IBM Plex Mono' }}>%{genelPct}</p>
      {/* Doküman satırları */}
      <div className="mt-1.5 pt-1.5 border-t border-[#D6DCE3] space-y-1">
        {satirlar.map(({ ad, stat }) => {
          const t = stat?.toplam ?? 0
          const tam = stat?.tamamlanan ?? 0
          const pct = t > 0 ? Math.floor((tam / t) * 100) : 0
          return (
            <div key={ad}>
              <div className="flex justify-between text-[10px] text-[#6B7785] mb-0.5">
                <span>{ad}</span>
                <span className="font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
                  {tam}/{t} · %{pct}
                </span>
              </div>
              <div className="h-1 bg-[#D6DCE3] rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#1B7A4B' : '#6B7785' }} />
              </div>
            </div>
          )
        })}
      </div>
    </Tag>
  )
}

// ─────────────────────────────────────────────────────────────
function TakipKutusu({ baslik, Ikon, renk, projeAdet, toplamProje, serit, tikla, uyari }: {
  baslik: string; Ikon: React.ElementType; renk: string
  projeAdet: number; toplamProje: number; serit: string
  tikla?: () => void; uyari?: boolean
}) {
  const Tag = tikla ? 'button' : 'div'
  const pct = toplamProje ? Math.floor((projeAdet / toplamProje) * 100) : 0
  return (
    <Tag onClick={tikla}
      className={`bg-white border rounded p-2.5 text-left w-full transition-colors ${
        tikla ? 'hover:border-[#1B4B73]/40 cursor-pointer' : ''
      } ${uyari ? 'border-l-4 border-l-[#B3261E] border-[#B3261E]/20' : 'border-[#D6DCE3]'}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Ikon size={13} style={{ color: renk }} aria-hidden />
        <span className="text-xs text-[#6B7785] font-medium leading-tight">{baslik}</span>
      </div>
      <p className="text-2xl font-bold text-[#0F1F33] tabular leading-none"
        style={{ fontFamily: 'IBM Plex Mono' }}>{formatSayi(projeAdet)}</p>
      <p className="text-xs text-[#6B7785] mt-0.5">
        <span className="font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>%{pct}</span> · {toplamProje} prj
      </p>
      <div className="mt-1.5 pt-1.5 border-t border-[#D6DCE3]">
        <p className="text-[10px] text-[#6B7785] leading-tight">{serit}</p>
      </div>
    </Tag>
  )
}

// ─── Aşama kutusu (Dizilim / Borulama / Pano / Devreye) ──────
function AsamaKutusu({ baslik, Ikon, renk, tamamlanan, kapsamBlok, toplamBlok, kapsamPrj, tikla, vurgulu }: {
  baslik: string; Ikon: React.ElementType; renk: string
  tamamlanan: number; kapsamBlok: number; toplamBlok: number; kapsamPrj: number
  tikla?: () => void; vurgulu?: boolean
}) {
  const pct = kapsamBlok ? Math.floor((tamamlanan / kapsamBlok) * 100) : 0
  const Tag = tikla ? 'button' : 'div'
  return (
    <Tag onClick={tikla}
      className={`bg-white border rounded p-2.5 text-left w-full transition-colors ${
        tikla ? 'hover:border-[#1B4B73]/40 cursor-pointer' : ''
      } ${vurgulu ? 'border-[#1B7A4B]/30' : 'border-[#D6DCE3]'}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Ikon size={13} style={{ color: renk }} aria-hidden />
        <span className="text-xs text-[#6B7785] font-medium leading-tight">{baslik}</span>
      </div>
      <p className="text-2xl font-bold text-[#0F1F33] tabular leading-none"
        style={{ fontFamily: 'IBM Plex Mono' }}>{formatSayi(kapsamPrj)}</p>
      <p className="text-xs font-mono mt-0.5" style={{ fontFamily: 'IBM Plex Mono', color: renk }}>
        %{pct}
      </p>
      {/* Portföy şeridi */}
      <div className="mt-1.5 pt-1.5 border-t border-[#D6DCE3]">
        <div className="flex justify-between text-[10px] text-[#6B7785] mb-0.5">
          <span>{formatSayi(tamamlanan)}/{formatSayi(kapsamBlok)} blok</span>
        </div>
        <div className="h-1 bg-[#D6DCE3] rounded-full overflow-hidden"
          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: renk }} />
        </div>
        {toplamBlok > 0 && (
          <p className="text-[10px] text-[#D6DCE3] mt-0.5 text-right">
            / {formatSayi(toplamBlok)} toplam
          </p>
        )}
      </div>
    </Tag>
  )
}

function islemMesg(islem: string, tablo: string, yeniDeger?: string): string {
  const adlar: Record<string, string> = {
    projeler: 'proje', blok_asamalari: 'aşama', hatalar: 'hata', saha_raporlari: 'rapor',
  }
  const ad = adlar[tablo] || tablo
  if (islem === 'ekleme') return `Yeni ${ad} oluşturuldu${yeniDeger ? ` (${yeniDeger})` : ''}`
  if (islem === 'guncelleme') return `${ad} güncellendi${yeniDeger ? ` → ${yeniDeger}` : ''}`
  if (islem === 'gonderim') return 'Rapor gönderildi'
  return `${ad} ${islem}`
}
