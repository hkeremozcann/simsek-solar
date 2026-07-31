import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, CheckCircle2, AlertCircle, Clock,
  Zap, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Minus, ChevronRight, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useDashboardStats, useMvProjeOzet, useAktiviteLogu, useAylikBlokVerisi } from '@/hooks/useProjects'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProjeDurumBadge, Badge } from '@/components/ui/Badge'
import { CardSkeleton, HataDurumu, TableSkeleton } from '@/components/common/QueryState'
import { formatTarih, formatGoreceli } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { MvProjeOzet } from '@/lib/types'

export default function Panel() {
  const navigate = useNavigate()
  const { kullanici } = useAuth()
  const { data: stats, isLoading: statsYukleniyor, error: statsHata, refetch: statsYenile } = useDashboardStats()
  const { data: projeler = [], isLoading: projelerYukleniyor, error: projelerHata, refetch: projelerYenile } = useMvProjeOzet()
  const { data: aktiviteler = [], isLoading: aktiviteYukleniyor } = useAktiviteLogu(undefined, 15)
  const { data: aylikVeri = [] } = useAylikBlokVerisi()

  const aktifProjeler = projeler.filter(p => p.aktif_mi || p.durum === 'Çalışıyor')
  const dikkat = projeler
    .filter(p => p.acik_hata > 0 || p.gecikmis_mi || p.hareketsiz_mi)
    .sort((a, b) => (b.acik_hata - a.acik_hata) || Number(b.gecikmis_mi) - Number(a.gecikmis_mi))
    .slice(0, 8)

  const kurumDagilim = projeler.reduce<Record<string, number>>((acc, p) => {
    const tip = p.kurum_tipi || 'Diğer'
    acc[tip] = (acc[tip] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Kontrol paneli"
        aciklama={`Hoş geldiniz, ${kullanici?.ad_soyad?.split(' ')[0] || ''}`}
        eylemler={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FolderKanban size={14} />}
            onClick={() => navigate('/projeler/yeni')}
          >
            Yeni proje
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-6">

        {/* ── 6 Özet Kutu ────────────────────────────────────── */}
        <section aria-labelledby="ozet-baslik">
          <h2 id="ozet-baslik" className="sr-only">Özet istatistikler</h2>

          {statsYukleniyor ? (
            <CardSkeleton sayi={6} />
          ) : statsHata ? (
            <HataDurumu hata={statsHata as Error} tekrarDene={statsYenile} mesaj="İstatistikler yüklenemedi" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <OzetKutu
                baslik="Aktif proje"
                deger={stats?.aktifProje ?? 0}
                Ikon={FolderKanban}
                renk="text-[#1B4B73]"
                bg="bg-[#1B4B73]/10"
                tikla={() => navigate('/projeler?durum=Çalışıyor')}
              />
              <OzetKutu
                baslik="Tamamlanan"
                deger={stats?.tamamlananProje ?? 0}
                Ikon={CheckCircle2}
                renk="text-[#1B7A4B]"
                bg="bg-[#1B7A4B]/10"
                tikla={() => navigate('/projeler?durum=Tamamlandı')}
              />
              <OzetKutu
                baslik="Açık hata"
                deger={stats?.acikHata ?? 0}
                Ikon={AlertCircle}
                renk={stats?.acikHata ? 'text-[#B3261E]' : 'text-[#6B7785]'}
                bg={stats?.acikHata ? 'bg-[#B3261E]/10' : 'bg-[#F5F7F9]'}
                tikla={() => navigate('/hatalar')}
                vurgu={!!stats?.acikHata}
              />
              <OzetKutu
                baslik="Süresi geçmiş hata"
                deger={stats?.sureciHata ?? 0}
                Ikon={Clock}
                renk={stats?.sureciHata ? 'text-[#7A1512]' : 'text-[#6B7785]'}
                bg={stats?.sureciHata ? 'bg-[#7A1512]/10' : 'bg-[#F5F7F9]'}
                tikla={() => navigate('/hatalar?suresi=gecmis')}
                vurgu={!!stats?.sureciHata}
              />
              <OzetKutu
                baslik="Bu ay devreye"
                deger={stats?.buAyDevreAlinan ?? 0}
                alt="blok"
                Ikon={Zap}
                renk="text-[#B4531F]"
                bg="bg-[#B4531F]/10"
              />
              <OzetKutu
                baslik="Gecikmiş proje"
                deger={stats?.gecikmisPrje ?? 0}
                Ikon={AlertTriangle}
                renk={stats?.gecikmisPrje ? 'text-[#9A6700]' : 'text-[#6B7785]'}
                bg={stats?.gecikmisPrje ? 'bg-[#9A6700]/10' : 'bg-[#F5F7F9]'}
                tikla={() => navigate('/projeler?gecikmiş=1')}
                vurgu={!!stats?.gecikmisPrje}
              />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Sol 2/3 ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dikkat gerektirenler */}
            {dikkat.length > 0 && (
              <Card padding="none">
                <CardHeader
                  title="Dikkat gerektiriyor"
                  subtitle={`${dikkat.length} proje önlem bekliyor`}
                  className="px-4 pt-4 pb-0"
                  action={
                    <button
                      onClick={() => navigate('/hatalar')}
                      className="text-xs text-[#1B4B73] hover:underline flex items-center gap-1"
                    >
                      Tüm hatalar <ChevronRight size={13} />
                    </button>
                  }
                />
                <ul role="list" className="divide-y divide-[#D6DCE3] mt-3">
                  {dikkat.map(p => (
                    <DikkatSatiri key={p.id} proje={p} onClick={() => navigate(`/projeler/${p.id}`)} />
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
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/projeler')}>
                    Tümünü gör
                  </Button>
                }
              />

              {projelerYukleniyor ? (
                <div className="mt-3">
                  <TableSkeleton satirSayisi={4} sutunSayisi={3} />
                </div>
              ) : projelerHata ? (
                <HataDurumu hata={projelerHata as Error} tekrarDene={projelerYenile} />
              ) : aktifProjeler.length === 0 ? (
                <div className="px-4 pb-6 pt-4 text-center">
                  <p className="text-sm text-[#6B7785] mb-3">Henüz aktif proje yok.</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/projeler/yeni')}>
                    İlk projeyi oluştur
                  </Button>
                </div>
              ) : (
                <ul role="list" className="divide-y divide-[#D6DCE3] mt-3">
                  {aktifProjeler.slice(0, 8).map(p => (
                    <ProjeSatiri key={p.id} proje={p} onClick={() => navigate(`/projeler/${p.id}`)} />
                  ))}
                </ul>
              )}
            </Card>

            {/* Aylık devreye alınan blok */}
            <Card>
              <CardHeader
                title="Aylık devreye alınan blok"
                subtitle="Son 12 ay — çubuk: aylık, çizgi: kümülatif"
              />
              {aylikVeri.length === 0 ? (
                <p className="text-sm text-[#6B7785] py-4 text-center">Henüz devreye alınan blok yok.</p>
              ) : (
                <div className="h-48" role="img" aria-label="Aylık devreye alınan blok grafiği">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aylikVeri} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D6DCE3" vertical={false} />
                      <XAxis dataKey="ay" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#6B7785' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#6B7785' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontFamily: 'IBM Plex Sans', fontSize: 12, border: '1px solid #D6DCE3', borderRadius: 4 }}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="sayi" fill="#B4531F" radius={[2, 2, 0, 0]} name="sayi" />
                      <Line type="monotone" dataKey="kumulatif" stroke="#1B4B73" strokeWidth={2} dot={false} name="kumulatif" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* ── Sağ 1/3 ────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Kurum dağılımı */}
            <Card>
              <CardHeader title="Kurum dağılımı" />
              {Object.keys(kurumDagilim).length === 0 ? (
                <p className="text-sm text-[#6B7785]">Henüz proje yok.</p>
              ) : (
                <ul className="space-y-2.5">
                  {Object.entries(kurumDagilim)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tip, sayi]) => {
                      const max = Math.max(...Object.values(kurumDagilim))
                      return (
                        <li key={tip}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#0F1F33] truncate text-xs">{tip}</span>
                            <span className="font-mono text-xs text-[#6B7785] flex-shrink-0 ml-2"
                              style={{ fontFamily: 'IBM Plex Mono' }}>
                              {sayi}
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#D6DCE3] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1B4B73] rounded-full"
                              style={{ width: `${(sayi / max) * 100}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                </ul>
              )}
            </Card>

            {/* Son 15 aktivite */}
            <Card padding="none">
              <CardHeader title="Son aktiviteler" className="px-4 pt-4 pb-0" />
              {aktiviteYukleniyor ? (
                <div className="mt-2"><TableSkeleton satirSayisi={5} sutunSayisi={2} /></div>
              ) : aktiviteler.length === 0 ? (
                <p className="text-sm text-[#6B7785] px-4 py-4">Henüz aktivite yok.</p>
              ) : (
                <ul className="divide-y divide-[#D6DCE3] mt-2" role="list">
                  {aktiviteler.slice(0, 15).map((a: {
                    id: string; islem: string; tablo: string; alan?: string;
                    yeni_deger?: string; tarih: string;
                    kullanici?: { ad_soyad: string } | null
                  }) => (
                    <li key={a.id} className="px-4 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#0F1F33] truncate">
                            {a.kullanici?.ad_soyad || 'Sistem'}
                          </p>
                          <p className="text-xs text-[#6B7785] truncate">
                            {islemMesg(a.islem, a.tablo, a.yeni_deger)}
                          </p>
                        </div>
                        <time
                          className="text-[10px] text-[#6B7785] flex-shrink-0 font-mono"
                          dateTime={a.tarih}
                          style={{ fontFamily: 'IBM Plex Mono' }}
                          title={formatTarih(a.tarih)}
                        >
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

// ─── Özet kutu bileşeni ───────────────────────────────────────
function OzetKutu({
  baslik, deger, alt, Ikon, renk, bg, tikla, vurgu,
}: {
  baslik: string
  deger: number
  alt?: string
  Ikon: React.ElementType
  renk: string
  bg: string
  tikla?: () => void
  vurgu?: boolean
}) {
  const Tag = tikla ? 'button' : 'div'
  return (
    <Tag
      onClick={tikla}
      className={`bg-white border rounded p-3 text-left w-full transition-colors ${
        tikla ? 'hover:border-[#1B4B73]/40 cursor-pointer' : ''
      } ${vurgu ? 'border-l-4 border-l-[#B3261E] border-[#B3261E]/30' : 'border-[#D6DCE3]'}`}
    >
      <div className={`inline-flex p-1.5 rounded mb-2 ${bg}`}>
        <Ikon size={14} className={renk} aria-hidden />
      </div>
      <p className="text-xs text-[#6B7785] font-medium">{baslik}</p>
      <p
        className="text-xl font-bold text-[#0F1F33] mt-0.5 tabular"
        style={{ fontFamily: 'IBM Plex Mono' }}
        aria-label={`${baslik}: ${deger}${alt ? ' ' + alt : ''}`}
      >
        {deger}
        {alt && <span className="text-xs font-normal text-[#6B7785] ml-1">{alt}</span>}
      </p>
    </Tag>
  )
}

// ─── Dikkat satırı ────────────────────────────────────────────
function DikkatSatiri({ proje, onClick }: { proje: MvProjeOzet; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 hover:bg-[#F5F7F9] transition-colors flex items-center justify-between gap-3 min-h-[56px]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#1B4B73] font-semibold flex-shrink-0"
              style={{ fontFamily: 'IBM Plex Mono' }}>
              {proje.proje_kodu}
            </span>
            <span className="text-sm font-medium text-[#0F1F33] truncate">{proje.proje_adi}</span>
          </div>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {proje.acik_hata > 0 && (
              <Badge variant="error">
                <AlertCircle size={10} aria-hidden />
                {proje.acik_hata} hata
              </Badge>
            )}
            {proje.gecikmis_mi && (
              <Badge variant="warning">
                <Clock size={10} aria-hidden />
                Gecikmiş
              </Badge>
            )}
            {proje.hareketsiz_mi && (
              <Badge variant="neutral">
                <Minus size={10} aria-hidden />
                Hareketsiz
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-[#D6DCE3] flex-shrink-0" aria-hidden />
      </button>
    </li>
  )
}

// ─── Proje listesi satırı ─────────────────────────────────────
function ProjeSatiri({ proje, onClick }: { proje: MvProjeOzet; onClick: () => void }) {
  const pct = proje.saha_yuzdesi ?? 0
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 hover:bg-[#F5F7F9] transition-colors min-h-[60px]"
      >
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-[#1B4B73] font-semibold flex-shrink-0"
              style={{ fontFamily: 'IBM Plex Mono' }}>
              {proje.proje_kodu}
            </span>
            <span className="text-sm font-medium text-[#0F1F33] truncate">{proje.proje_adi}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {proje.acik_hata > 0 && (
              <Badge variant="error">
                <AlertCircle size={10} aria-hidden /> {proje.acik_hata}
              </Badge>
            )}
            <span className="text-xs font-mono text-[#6B7785]" style={{ fontFamily: 'IBM Plex Mono' }}>
              %{pct}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-[#D6DCE3] rounded-full overflow-hidden"
          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
          aria-label={`${proje.proje_adi} saha ilerlemesi %${pct}`}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? '#1B7A4B' : '#B4531F',
            }}
          />
        </div>
        <p className="text-xs text-[#6B7785] mt-1">
          {proje.il} · {proje.blok_sayisi} blok · {proje.kurum_tipi}
        </p>
      </button>
    </li>
  )
}

// ─── Aktivite mesaj formatı ───────────────────────────────────
function islemMesg(islem: string, tablo: string, yeniDeger?: string): string {
  const tabloAdi: Record<string, string> = {
    projeler: 'proje', blok_asamalari: 'aşama',
    hatalar: 'hata', saha_raporlari: 'rapor', kullanicilar: 'kullanıcı',
  }
  const ad = tabloAdi[tablo] || tablo
  if (islem === 'ekleme') return `Yeni ${ad} oluşturuldu${yeniDeger ? ` (${yeniDeger})` : ''}`
  if (islem === 'guncelleme') return `${ad} güncellendi${yeniDeger ? ` → ${yeniDeger}` : ''}`
  if (islem === 'gonderim') return `Rapor gönderildi`
  if (islem === 'kural_asimi') return `Kural aşımı (${ad})`
  return `${ad} ${islem}`
}
