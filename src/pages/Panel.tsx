import { useNavigate } from 'react-router-dom'
import { useProjects, useDashboardStats } from '@/hooks/useProjects'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard, Card, CardHeader, ProgressBar, EmptyState } from '@/components/ui/Card'
import { ProjeDurumBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  sahaIlerlemeHesapla, acikHataSayisi, projeGecikmeMi,
  formatTarih, formatGoreceli
} from '@/lib/utils'
import type { Proje, ProjeDurumu } from '@/lib/types'
import { differenceInDays } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

export default function Panel() {
  const navigate = useNavigate()
  const { kullanici } = useAuth()
  const { data: stats } = useDashboardStats()
  const { data: projeData, isLoading } = useProjects()
  const projeler = projeData?.projeler ?? []

  // Aktif projeler
  const aktifProjeler = projeler.filter((p) => p.aktif_mi)

  // Dikkat listesi: hatalı → gecikmiş → hareketsiz
  const dikkatGerektiren = projeler
    .filter((p) => {
      const hatalar = acikHataSayisi(p.bloklar || [])
      const gecikmiş = projeGecikmeMi(p.hedef_teslim_tarihi, p.durum as ProjeDurumu)
      return hatalar > 0 || gecikmiş
    })
    .slice(0, 6)

  // Kurum tipi dağılımı
  const kurumDagilim = projeler.reduce<Record<string, number>>((acc, p) => {
    const tip = p.firma?.kurum_tipi || 'Diğer'
    acc[tip] = (acc[tip] || 0) + 1
    return acc
  }, {})
  const maxKurum = Math.max(...Object.values(kurumDagilim), 1)

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Kontrol paneli"
        aciklama={`Hoş geldiniz, ${kullanici?.ad_soyad?.split(' ')[0] || ''}`}
        eylemler={
          <Button variant="primary" size="sm" onClick={() => navigate('/projeler/yeni')}>
            + Yeni proje
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* 4 Özet Kutu */}
        <section aria-labelledby="ozet-baslik">
          <h2 id="ozet-baslik" className="sr-only">Özet istatistikler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              baslik="Aktif proje"
              deger={stats?.aktifProje ?? '—'}
              ikon={<span className="text-2xl" aria-hidden>◫</span>}
              renk="info"
            />
            <StatCard
              baslik="Tamamlanan proje"
              deger={stats?.tamamlananProje ?? '—'}
              ikon={<span className="text-2xl" aria-hidden>✓</span>}
              renk="success"
            />
            <StatCard
              baslik="Açık hata"
              deger={stats?.acikHata ?? '—'}
              ikon={<span className="text-2xl" aria-hidden>⚑</span>}
              renk={stats?.acikHata ? 'error' : 'default'}
            />
            <StatCard
              baslik="Bu ay devreye alınan"
              deger={stats?.buAyDevreAlinan ?? '—'}
              alt="blok"
              ikon={<span className="text-2xl" aria-hidden>●</span>}
              renk="warning"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Dikkat + Aktif projeler */}
          <div className="lg:col-span-2 space-y-5">
            {/* Dikkat gerektirenler */}
            {dikkatGerektiren.length > 0 && (
              <Card padding="none">
                <CardHeader
                  title="Dikkat gerektiriyor"
                  subtitle="Hatalı ve gecikmiş projeler"
                  className="px-4 pt-4"
                />
                <ul className="divide-y divide-[#D6DCE3]">
                  {dikkatGerektiren.map((proje) => {
                    const hatalar = acikHataSayisi(proje.bloklar || [])
                    const gecikmiş = projeGecikmeMi(proje.hedef_teslim_tarihi, proje.durum as ProjeDurumu)
                    const gecikGun = proje.hedef_teslim_tarihi
                      ? differenceInDays(new Date(), new Date(proje.hedef_teslim_tarihi))
                      : 0
                    return (
                      <li key={proje.id}>
                        <button
                          onClick={() => navigate(`/projeler/${proje.id}`)}
                          className="w-full text-left px-4 py-3 hover:bg-[#F5F7F9] transition-colors flex items-center justify-between gap-4 min-h-[60px]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[#1B4B73]"
                                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                                {proje.proje_kodu}
                              </span>
                              <span className="text-sm font-medium text-[#0F1F33] truncate max-w-48">
                                {proje.proje_adi}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              {hatalar > 0 && (
                                <Badge variant="error" className="text-xs">
                                  <span aria-hidden>⚑</span> {hatalar} hata
                                </Badge>
                              )}
                              {gecikmiş && (
                                <Badge variant="warning" className="text-xs">
                                  <span aria-hidden>⏰</span> {gecikGun} gün gecikmiş
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-[#D6DCE3]" aria-hidden>›</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )}

            {/* Aktif proje listesi */}
            <Card padding="none">
              <CardHeader
                title="Devam eden projeler"
                subtitle={`${aktifProjeler.length} aktif proje`}
                className="px-4 pt-4"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/projeler')}>
                    Tümünü gör
                  </Button>
                }
              />
              {isLoading ? (
                <div className="px-4 pb-4 text-sm text-[#6B7785]">Yükleniyor…</div>
              ) : aktifProjeler.length === 0 ? (
                <EmptyState
                  baslik="Aktif proje yok"
                  eylem={
                    <Button variant="primary" size="sm" onClick={() => navigate('/projeler/yeni')}>
                      + Yeni proje ekle
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-[#D6DCE3]">
                  {aktifProjeler.slice(0, 8).map((proje) => {
                    const ilerleme = sahaIlerlemeHesapla(proje.bloklar || [])
                    const hatalar = acikHataSayisi(proje.bloklar || [])
                    return (
                      <li key={proje.id}>
                        <button
                          onClick={() => navigate(`/projeler/${proje.id}`)}
                          className="w-full text-left px-4 py-3 hover:bg-[#F5F7F9] transition-colors min-h-[64px]"
                        >
                          <div className="flex items-center justify-between gap-4 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="text-xs font-mono text-[#1B4B73] font-semibold flex-shrink-0"
                                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                              >
                                {proje.proje_kodu}
                              </span>
                              <span className="text-sm font-medium text-[#0F1F33] truncate">
                                {proje.proje_adi}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hatalar > 0 && (
                                <Badge variant="error" className="text-xs">
                                  <span aria-hidden>⚑</span> {hatalar}
                                </Badge>
                              )}
                              <span
                                className="text-xs font-mono text-[#6B7785]"
                                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                              >
                                %{ilerleme}
                              </span>
                            </div>
                          </div>
                          <ProgressBar yuzdesi={ilerleme} showLabel={false} />
                          <p className="text-xs text-[#6B7785] mt-1">
                            {proje.il} · {proje.blok_sayisi} blok · {proje.firma?.ad}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Sağ: Kurum dağılımı */}
          <div className="space-y-5">
            <Card>
              <CardHeader title="Kurum tipine göre dağılım" />
              {Object.keys(kurumDagilim).length === 0 ? (
                <p className="text-sm text-[#6B7785]">Henüz veri yok.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(kurumDagilim)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tip, sayi]) => (
                      <li key={tip}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-[#0F1F33] truncate">{tip}</span>
                          <span
                            className="font-mono text-[#6B7785] flex-shrink-0 ml-2"
                            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                          >
                            {sayi}
                          </span>
                        </div>
                        <div
                          className="h-2 bg-[#1B4B73] rounded-full transition-all"
                          style={{ width: `${(sayi / maxKurum) * 100}%` }}
                          role="img"
                          aria-label={`${tip}: ${sayi} proje`}
                        />
                      </li>
                    ))}
                </ul>
              )}
            </Card>

            {/* Hızlı bağlantılar */}
            <Card>
              <CardHeader title="Hızlı erişim" />
              <nav aria-label="Hızlı erişim bağlantıları">
                <ul className="space-y-1">
                  {[
                    { href: '/projeler?filtre=hatali', label: '⚑ Hatalı projeler', renk: '#B3261E' },
                    { href: '/projeler?filtre=gecikmiş', label: '⏰ Gecikmiş projeler', renk: '#9A6700' },
                    { href: '/projeler', label: '◫ Tüm projeler', renk: '#1B4B73' },
                    { href: '/raporlar', label: '≡ Raporlar', renk: '#6B7785' },
                  ].map((link) => (
                    <li key={link.href}>
                      <button
                        onClick={() => navigate(link.href)}
                        className="w-full text-left text-sm px-3 py-2 rounded hover:bg-[#F5F7F9] transition-colors min-h-[44px] flex items-center"
                        style={{ color: link.renk }}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
