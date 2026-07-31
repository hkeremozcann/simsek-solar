import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '@/hooks/useProjects'
import { BlokMatrisi as BlokMatrisiBileseni } from './BlokMatrisi'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { AsamaBadge, ProjeDurumBadge, Badge } from '@/components/ui/Badge'
import { Card, CardHeader, ProgressBar, EmptyState } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { FormField, Select, Textarea } from '@/components/ui/FormField'
import {
  sahaIlerlemeHesapla, devreAlinanBlokSayisi, acikHataSayisi,
  projeGecikmeMi, formatTarih, formatTarihSaat, formatGoreceli, oncekiAsamaTamamMi, cn
} from '@/lib/utils'
import {
  ASAMA_SIRALAMA, ASAMA_ETIKETI, type AsamaTipi, type AsamaDurumu,
  type AsamaSonucu, type ProjeDurumu, type BlokAsamasi, type Blok,
  type ProjeDokumani, type SahaRaporu, type SantiyeYetkilisi
} from '@/lib/types'

type Sekme = 'genel' | 'matris' | 'destek' | 'raporlar' | 'hatalar' | 'zaman'

export default function ProjeDetay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { kullanici, rolKontrol } = useAuth()
  const [aktifSekme, setAktifSekme] = useState<Sekme>('matris')
  const { data: proje, isLoading, error } = useProject(id!)

  if (isLoading) {
    return (
      <div className="p-8 text-center text-[#6B7785]">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-[#B4531F] border-t-transparent rounded-full mb-2" aria-hidden />
        <p>Proje yükleniyor…</p>
      </div>
    )
  }

  if (error || !proje) {
    return (
      <div className="p-8">
        <EmptyState
          baslik="Proje bulunamadı"
          aciklama="Bu proje mevcut değil veya erişim izniniz yok."
          eylem={<Button variant="outline" onClick={() => navigate('/projeler')}>← Projelere dön</Button>}
        />
      </div>
    )
  }

  const bloklar = proje.bloklar || []
  const ilerleme = sahaIlerlemeHesapla(bloklar)
  const devreAlinan = devreAlinanBlokSayisi(bloklar)
  const hataCount = acikHataSayisi(bloklar)
  const gecikmiş = projeGecikmeMi(proje.hedef_teslim_tarihi, proje.durum as ProjeDurumu)
  const yazabilir = rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu', 'saha_teknisyeni'])

  const SEKMELER: { id: Sekme; label: string }[] = [
    { id: 'genel', label: 'Genel Bakış' },
    { id: 'matris', label: 'Blok Matrisi' },
    { id: 'destek', label: 'Proje Desteği' },
    { id: 'raporlar', label: 'Saha Raporları' },
    { id: 'hatalar', label: `Hatalar${hataCount > 0 ? ` (${hataCount})` : ''}` },
    { id: 'zaman', label: 'Zaman Çizelgesi' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      {/* Sabit başlık */}
      <header className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-4 sticky top-0 z-30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate('/projeler')}
                className="text-sm text-[#6B7785] hover:text-[#0F1F33] min-h-[36px]"
              >
                ← Projeler
              </button>
              <span className="text-[#D6DCE3]">/</span>
              <span
                className="text-sm font-mono text-[#1B4B73] font-semibold"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {proje.proje_kodu}
              </span>
              <ProjeDurumBadge durum={proje.durum as ProjeDurumu} />
              {gecikmiş && <Badge variant="warning"><span aria-hidden>⏰</span> Gecikmiş</Badge>}
              {hataCount > 0 && (
                <Badge variant="error"><span aria-hidden>⚑</span> {hataCount} açık hata</Badge>
              )}
            </div>
            <h1
              className="text-xl font-bold text-[#0F1F33] mt-1"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              {proje.proje_adi}
            </h1>
            <p className="text-sm text-[#6B7785] mt-0.5">{proje.firma?.ad} · {proje.il}</p>
          </div>

          {/* Hızlı aksiyonlar */}
          {rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu']) && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projeler/${proje.id}/duzenle`)}
              >
                ✎ Düzenle
              </Button>
            </div>
          )}

          {/* İlerleme göstergeleri */}
          <div className="flex gap-6 text-sm flex-shrink-0">
            <div>
              <p className="text-xs text-[#6B7785] mb-1">Saha ilerlemesi</p>
              <div className="flex items-center gap-2">
                <ProgressBar yuzdesi={ilerleme} showLabel={false} />
                <span className="font-mono text-sm font-semibold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  %{ilerleme}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7785]">Devreye alınan</p>
              <p className="font-mono font-bold text-lg" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {devreAlinan} / {proje.blok_sayisi}
              </p>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <nav aria-label="Proje sekmeleri" className="mt-3 -mb-4">
          <ul className="flex gap-0 overflow-x-auto" role="tablist">
            {SEKMELER.map((sekme) => (
              <li key={sekme.id} role="presentation">
                <button
                  role="tab"
                  aria-selected={aktifSekme === sekme.id}
                  onClick={() => setAktifSekme(sekme.id)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px]',
                    aktifSekme === sekme.id
                      ? 'border-[#B4531F] text-[#B4531F]'
                      : 'border-transparent text-[#6B7785] hover:text-[#0F1F33]'
                  )}
                >
                  {sekme.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="p-4 md:p-6" role="tabpanel">
        {/* ─── GENEL BAKIŞ ─── */}
        {aktifSekme === 'genel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Proje bilgileri" />
              <dl className="space-y-2 text-sm">
                <InfoRow label="Firma" value={proje.firma?.ad} />
                <InfoRow label="Kurum tipi" value={proje.firma?.kurum_tipi} />
                <InfoRow label="Sözleşme no" value={proje.sozlesme_no} />
                <InfoRow label="Sözleşme tarihi" value={formatTarih(proje.sozlesme_tarihi)} />
                <InfoRow label="Hedef teslim" value={formatTarih(proje.hedef_teslim_tarihi)} />
                <InfoRow label="Sistem tipi" value={proje.sistem_tipi} />
                <InfoRow label="Kapsam" value={proje.montaj_kapsami?.join(', ')} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="Teknik miktarlar" />
              <dl className="space-y-2 text-sm">
                <InfoRow label="Blok sayısı" value={proje.blok_sayisi} mono />
                <InfoRow label="Toplam kollektör" value={proje.toplam_kollektor_sayisi} mono />
                <InfoRow label="Toplam sehpa" value={proje.toplam_sehpa_sayisi} mono />
                <InfoRow label="Toplam pano" value={proje.toplam_pano_sayisi} mono />
                <InfoRow label="Boyler sayısı" value={proje.boyler_sayisi} mono />
                <InfoRow label="Boyler kapasitesi" value={proje.boyler_kapasitesi_lt ? `${proje.boyler_kapasitesi_lt} lt` : undefined} />
                <InfoRow label="Pompa grubu" value={proje.pompa_grubu_sayisi} mono />
              </dl>
            </Card>

            {proje.santiye_yetkilileri && proje.santiye_yetkilileri.length > 0 && (
              <Card>
                <CardHeader title="Şantiye yetkilileri" />
                <ul className="space-y-3">
                  {proje.santiye_yetkilileri.map((sy) => (
                    <li key={sy.id} className="text-sm border-b border-[#D6DCE3] pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#0F1F33]">{sy.ad_soyad}</span>
                        {sy.birincil_mi && <Badge variant="info">Birincil</Badge>}
                      </div>
                      {sy.gorevi && <p className="text-[#6B7785]">{sy.gorevi}</p>}
                      <div className="flex gap-3 mt-1">
                        {sy.telefon && (
                          <a href={`tel:${sy.telefon}`} className="text-[#1B4B73] hover:underline">
                            📞 {sy.telefon}
                          </a>
                        )}
                        {sy.eposta && (
                          <a href={`mailto:${sy.eposta}`} className="text-[#1B4B73] hover:underline truncate">
                            ✉ {sy.eposta}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {proje.notlar && (
              <Card>
                <CardHeader title="Notlar" />
                <p className="text-sm text-[#6B7785] whitespace-pre-wrap">{proje.notlar}</p>
              </Card>
            )}
          </div>
        )}

        {/* ─── BLOK MATRİSİ ─── */}
        {aktifSekme === 'matris' && (
          <BlokMatrisiBileseni
            bloklar={bloklar}
            projeId={proje.id}
            yazabilir={yazabilir}
            yonetici={rolKontrol(['yonetici'])}
          />
        )}

        {/* ─── PROJE DESTEĞİ ─── */}
        {aktifSekme === 'destek' && (
          <ProjeDestek dokumanlari={proje.proje_dokumanlari || []} projeId={proje.id} yazabilir={yazabilir} />
        )}

        {/* ─── SAHA RAPORLARI ─── */}
        {aktifSekme === 'raporlar' && (
          <SahaRaporlariSekme raporlar={proje.saha_raporlari || []} projeId={proje.id} yazabilir={yazabilir} />
        )}

        {/* ─── HATALAR ─── */}
        {aktifSekme === 'hatalar' && (
          <HatalarSekme bloklar={bloklar} />
        )}

        {/* ─── ZAMAN ÇİZELGESİ ─── */}
        {aktifSekme === 'zaman' && (
          <ZamanCizelgesi bloklar={bloklar} />
        )}
      </div>

      {/* Aşama paneli BlokMatrisi bileşeni içinde yönetilir */}
    </div>
  )
}

// ─── Blok Matrisi ───────────────────────────────────────────
function BlokMatrisi({
  bloklar,
  yazabilir,
  yonetici,
  topluSecim,
  setTopluSecim,
  onAsamaClick,
}: {
  bloklar: Blok[]
  yazabilir: boolean
  yonetici: boolean
  topluSecim: string[]
  setTopluSecim: (s: string[]) => void
  onAsamaClick: (asama: BlokAsamasi, blok: Blok) => void
  projeId: string
}) {
  // Sütun bazında sayaçlar
  const sayaclar = ASAMA_SIRALAMA.map((tip) => ({
    tip,
    tamamlanan: bloklar.filter((b) =>
      b.asamalar?.find((a) => a.asama_tipi === tip)?.durum === 'Tamamlandı' &&
      b.asamalar?.find((a) => a.asama_tipi === tip)?.sonuc === 'Uygun'
    ).length,
    hatali: bloklar.filter((b) =>
      b.asamalar?.find((a) => a.asama_tipi === tip)?.sonuc === 'Hatalı'
    ).length,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7785]">
          Her hücreye tıklayarak aşama durumunu güncelleyin.
          {topluSecim.length > 0 && (
            <span className="ml-2 font-medium text-[#B4531F]">
              {topluSecim.length} blok seçili
            </span>
          )}
        </p>
        {topluSecim.length > 0 && (
          <button
            onClick={() => setTopluSecim([])}
            className="text-sm text-[#6B7785] hover:text-[#B3261E] min-h-[36px] px-2"
          >
            Seçimi temizle
          </button>
        )}
      </div>

      <div className="table-scroll">
        <table
          className="w-full border-collapse"
          aria-label="Blok ilerleme matrisi"
        >
          <thead>
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide min-w-32">
                Blok
              </th>
              {ASAMA_SIRALAMA.map((tip) => (
                <th key={tip} scope="col" className="px-3 py-2 text-center text-xs font-semibold text-[#6B7785] uppercase tracking-wide min-w-28">
                  {ASAMA_ETIKETI[tip]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloklar.map((blok) => {
              const secili = topluSecim.includes(blok.id)
              return (
                <tr
                  key={blok.id}
                  className={cn(
                    'border-b border-[#D6DCE3] transition-colors',
                    secili ? 'bg-[#1B4B73]/5' : 'hover:bg-[#F5F7F9]'
                  )}
                >
                  <th
                    scope="row"
                    className="px-3 py-2 text-sm font-semibold text-[#0F1F33] text-left"
                  >
                    <div className="flex items-center gap-2">
                      {yazabilir && (
                        <input
                          type="checkbox"
                          checked={secili}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTopluSecim([...topluSecim, blok.id])
                            } else {
                              setTopluSecim(topluSecim.filter((id) => id !== blok.id))
                            }
                          }}
                          className="w-4 h-4"
                          aria-label={`${blok.blok_adi} seç`}
                        />
                      )}
                      {blok.blok_adi}
                    </div>
                  </th>
                  {ASAMA_SIRALAMA.map((tip) => {
                    const asama = blok.asamalar?.find((a) => a.asama_tipi === tip)
                    if (!asama) return <td key={tip} className="px-3 py-2 text-center text-xs text-[#6B7785]">—</td>
                    return (
                      <td key={tip} className="px-3 py-2 text-center">
                        <button
                          onClick={() => onAsamaClick(asama, blok)}
                          disabled={!yazabilir}
                          className={cn(
                            'inline-flex items-center justify-center min-w-[100px] min-h-[44px] px-2 py-1 rounded transition-colors',
                            yazabilir
                              ? 'hover:bg-[#F5F7F9] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B4531F]'
                              : 'cursor-default'
                          )}
                          aria-label={`${blok.blok_adi} — ${tip}: ${asama.durum}${asama.sonuc ? ` (${asama.sonuc})` : ''}`}
                        >
                          <AsamaBadge durum={asama.durum} sonuc={asama.sonuc} />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          {/* Alt satır: sütun sayaçları */}
          <tfoot>
            <tr className="bg-[#F5F7F9] border-t border-[#D6DCE3]">
              <th scope="row" className="px-3 py-2 text-xs font-semibold text-[#6B7785] text-left">
                Durum
              </th>
              {sayaclar.map(({ tip, tamamlanan, hatali }) => (
                <td key={tip} className="px-3 py-2 text-center">
                  <span
                    className="text-xs font-mono text-[#6B7785]"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {tamamlanan}/{bloklar.length}
                    {hatali > 0 && (
                      <span className="text-[#B3261E] ml-1">· {hatali}⚑</span>
                    )}
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-[#6B7785] mt-3">
        Devreye alınan: <strong className="font-mono">{bloklar.filter((b) => b.asamalar?.find((a) => a.asama_tipi === 'Devreye Alma' && a.durum === 'Tamamlandı' && a.sonuc === 'Uygun')).length} / {bloklar.length} blok</strong>
      </p>
    </div>
  )
}

// ─── Aşama Güncelleme Paneli ────────────────────────────────
function AsamaPanel({
  asama,
  blok,
  projeId,
  yazabilir,
  yonetici,
  onKapat,
  onKaydet,
  isPending,
  allAsamalar,
}: {
  asama: BlokAsamasi
  blok: Blok
  projeId: string
  yazabilir: boolean
  yonetici: boolean
  onKapat: () => void
  onKaydet: (durum: AsamaDurumu, sonuc: AsamaSonucu | undefined, aciklama: string, kuralAtlandi: boolean) => Promise<void>
  isPending: boolean
  allAsamalar: BlokAsamasi[]
}) {
  const [durum, setDurum] = useState<AsamaDurumu>(asama.durum)
  const [sonuc, setSonuc] = useState<AsamaSonucu | ''>((asama.sonuc as AsamaSonucu) || '')
  const [aciklama, setAciklama] = useState(asama.aciklama || '')
  const [kuralAtlamaOnay, setKuralAtlamaOnay] = useState(false)
  const [hatalar, setHatalar] = useState<Record<string, string>>({})

  const oncekiTamamMi = oncekiAsamaTamamMi(allAsamalar, asama.sira_no)
  const kuralIhlali = durum === 'Tamamlandı' && !oncekiTamamMi && asama.sira_no > 1

  function dogrula(): boolean {
    const h: Record<string, string> = {}
    if (durum === 'Tamamlandı' && !sonuc) {
      h.sonuc = 'Sonuç seçilmelidir: Uygun veya Hatalı.'
    }
    if (sonuc === 'Hatalı' && aciklama.length < 10) {
      h.aciklama = 'Hatalı işaretleme için açıklama zorunludur (en az 10 karakter).'
    }
    if (kuralIhlali && !kuralAtlamaOnay) {
      h.kural = `${ASAMA_SIRALAMA[asama.sira_no - 2]} tamamlanmadan bu aşama kapatılamaz. Yönetici onayı gereklidir.`
    }
    setHatalar(h)
    return Object.keys(h).length === 0
  }

  async function handleKaydet() {
    if (!dogrula()) return
    await onKaydet(
      durum,
      durum === 'Tamamlandı' ? (sonuc as AsamaSonucu) : undefined,
      aciklama,
      kuralIhlali && kuralAtlamaOnay
    )
  }

  return (
    <div
      className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white border-l border-[#D6DCE3] z-50 flex flex-col slide-in-right"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-baslik"
    >
      {/* Başlık */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#D6DCE3]">
        <div>
          <h2
            id="panel-baslik"
            className="text-base font-semibold text-[#0F1F33]"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {blok.blok_adi} — {asama.asama_tipi}
          </h2>
          <p className="text-xs text-[#6B7785] mt-0.5">Aşama {asama.sira_no} / 5</p>
        </div>
        <button
          onClick={onKapat}
          className="p-2 rounded hover:bg-[#F5F7F9] text-[#6B7785] min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Paneli kapat"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Mevcut durum */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6B7785]">Mevcut durum:</span>
          <AsamaBadge durum={asama.durum} sonuc={asama.sonuc} />
        </div>

        {/* Kural ihlali uyarısı */}
        {kuralIhlali && (
          <div
            className="bg-amber-50 border border-[#9A6700]/30 rounded p-3"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-[#9A6700] font-medium">⚠ Sıra kuralı ihlali</p>
            <p className="text-xs text-[#9A6700] mt-1">
              {ASAMA_SIRALAMA[asama.sira_no - 2]} tamamlanmadan bu aşama kapatılamaz.
              {yonetici && ' Yönetici olarak gerekçe yazarak devam edebilirsiniz.'}
            </p>
            {yonetici && (
              <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={kuralAtlamaOnay}
                  onChange={(e) => setKuralAtlamaOnay(e.target.checked)}
                  className="w-4 h-4"
                />
                Sıra kuralını atlayarak devam et (log'a yazılacak)
              </label>
            )}
          </div>
        )}

        {yazabilir && (
          <>
            <FormField label="Durum" required>
              {(id) => (
                <Select
                  id={id}
                  value={durum}
                  onChange={(e) => {
                    setDurum(e.target.value as AsamaDurumu)
                    if (e.target.value !== 'Tamamlandı') setSonuc('')
                  }}
                >
                  <option value="Başlamadı">Başlamadı</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                </Select>
              )}
            </FormField>

            {durum === 'Tamamlandı' && (
              <FormField label="Sonuç" required error={hatalar.sonuc}>
                {(id, describedBy) => (
                  <div className="flex gap-3" id={id} role="group" aria-describedby={describedBy}>
                    <label className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 rounded border-2 cursor-pointer min-h-[52px] text-sm font-medium transition-colors',
                      sonuc === 'Uygun'
                        ? 'border-[#1B7A4B] bg-green-50 text-[#1B7A4B]'
                        : 'border-[#D6DCE3] hover:border-[#6B7785]'
                    )}>
                      <input type="radio" name="sonuc" value="Uygun"
                        checked={sonuc === 'Uygun'} onChange={() => setSonuc('Uygun')}
                        className="sr-only" />
                      <span aria-hidden>✓</span> Uygun
                    </label>
                    <label className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 rounded border-2 cursor-pointer min-h-[52px] text-sm font-medium transition-colors',
                      sonuc === 'Hatalı'
                        ? 'border-[#B3261E] bg-red-50 text-[#B3261E]'
                        : 'border-[#D6DCE3] hover:border-[#6B7785]'
                    )}>
                      <input type="radio" name="sonuc" value="Hatalı"
                        checked={sonuc === 'Hatalı'} onChange={() => setSonuc('Hatalı')}
                        className="sr-only" />
                      <span aria-hidden>✕</span> Hatalı
                    </label>
                  </div>
                )}
              </FormField>
            )}

            <FormField
              label="Açıklama"
              required={sonuc === 'Hatalı'}
              error={hatalar.aciklama}
              hint={sonuc === 'Hatalı' ? 'Hata açıklaması zorunludur (en az 10 karakter).' : undefined}
            >
              {(id, describedBy) => (
                <Textarea
                  id={id}
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Kontrol notları, tespitler..."
                  aria-describedby={describedBy}
                  error={!!hatalar.aciklama}
                />
              )}
            </FormField>

            {hatalar.kural && (
              <p className="text-sm text-[#9A6700]" role="alert">{hatalar.kural}</p>
            )}
          </>
        )}

        {/* Geçmiş — aktivite_logu'ndan çekilir (V2) */}
        {false && (
          <div>
            <ul className="space-y-2">
              {[].map((_kayit: unknown, i) => {
                return (
                  <li key={i} />
                )
              })}
            </ul>
          </div>
        )}

        <div className="text-xs text-[#6B7785] space-y-1">
          {asama.kontrol_eden && (
            <p>Son kontrol: <strong>{asama.kontrol_eden.ad_soyad}</strong></p>
          )}
          {asama.kontrol_tarihi && (
            <p>Tarih: <strong>{formatTarihSaat(asama.kontrol_tarihi)}</strong></p>
          )}
        </div>
      </div>

      {yazabilir && (
        <div className="px-5 py-4 border-t border-[#D6DCE3] flex gap-3">
          <Button variant="outline" onClick={onKapat} className="flex-1">
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={handleKaydet}
            loading={isPending}
            disabled={kuralIhlali && !yonetici}
            className="flex-1"
          >
            Aşamayı kaydet
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Proje Desteği Sekmesi ────────────────────────────────────
function ProjeDestek({
  dokumanlari,
  projeId,
  yazabilir,
}: {
  dokumanlari: ProjeDokumani[]
  projeId: string
  yazabilir: boolean
}) {
  if (!dokumanlari || dokumanlari.length === 0) {
    return (
      <EmptyState
        baslik="Proje desteği kapsamda değil"
        aciklama="Bu proje Proje Desteği kapsamı seçilmeden oluşturulmuş."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {dokumanlari.map((dok) => (
        <Card key={dok.id}>
          <CardHeader title={dok.dokuman_tipi} />
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[#6B7785]">Durum</span>
              <p className="text-sm font-medium mt-0.5">{dok.durum}</p>
            </div>
            {dok.revizyon_no && (
              <div>
                <span className="text-xs text-[#6B7785]">Revizyon</span>
                <p className="text-sm font-mono">{dok.revizyon_no}</p>
              </div>
            )}
            {dok.gonderim_tarihi && (
              <div>
                <span className="text-xs text-[#6B7785]">Gönderim</span>
                <p className="text-sm">{formatTarih(dok.gonderim_tarihi)}</p>
              </div>
            )}
            {dok.onay_tarihi && (
              <div>
                <span className="text-xs text-[#6B7785]">Onay tarihi</span>
                <p className="text-sm">{formatTarih(dok.onay_tarihi)}</p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Saha Raporları Sekmesi ──────────────────────────────────
function SahaRaporlariSekme({ raporlar, projeId, yazabilir }: {
  raporlar: SahaRaporu[]
  projeId: string
  yazabilir: boolean
}) {
  const navigate = useNavigate()
  return (
    <div>
      {yazabilir && (
        <div className="mb-4">
          <Button variant="primary" onClick={() => navigate(`/projeler/${projeId}/rapor/yeni`)}>
            + Yeni saha raporu oluştur
          </Button>
        </div>
      )}
      {raporlar.length === 0 ? (
        <EmptyState baslik="Henüz saha raporu oluşturulmamış" />
      ) : (
        <div className="space-y-3">
          {raporlar.map((rapor) => (
            <Card key={rapor.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0F1F33]">{rapor.rapor_tipi}</span>
                    <Badge variant={rapor.gonderildi_mi ? 'success' : 'neutral'}>
                      {rapor.gonderildi_mi ? '✓ Gönderildi' : 'Taslak'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6B7785] mt-0.5">
                    {formatTarih(rapor.rapor_tarihi)} · {rapor.hazirlayan?.ad_soyad}
                  </p>
                  <p className="text-sm text-[#0F1F33] mt-1 line-clamp-2">{rapor.ozet}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hatalar Sekmesi ──────────────────────────────────────────
function HatalarSekme({ bloklar }: { bloklar: Blok[] }) {
  const hataliAsamalar = bloklar.flatMap((blok) =>
    (blok.asamalar || [])
      .filter((a) => a.sonuc === 'Hatalı')
      .map((a) => ({ ...a, blokAdi: blok.blok_adi }))
  )

  if (hataliAsamalar.length === 0) {
    return <EmptyState baslik="Açık hata yok" aciklama="Tüm aşamalarda hata bulunmuyor." />
  }

  return (
    <div className="space-y-3">
      {hataliAsamalar.map((asama) => (
        <div
          key={asama.id}
          className="bg-white border border-[#B3261E]/30 border-l-4 border-l-[#B3261E] rounded p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[#0F1F33]">
                {(asama as unknown as { blokAdi: string }).blokAdi} — {asama.asama_tipi}
              </span>
              <Badge variant="error" className="ml-2">✕ Hatalı</Badge>
            </div>
            {asama.kontrol_tarihi && (
              <span className="text-xs text-[#6B7785] font-mono">{formatTarih(asama.kontrol_tarihi)}</span>
            )}
          </div>
          {asama.aciklama && (
            <p className="text-sm text-[#6B7785] mt-2">{asama.aciklama}</p>
          )}
          {/* Düzeltme son tarihi V2'de hatalar tablosunda yönetilir */}
        </div>
      ))}
    </div>
  )
}

// ─── Zaman Çizelgesi ──────────────────────────────────────────
function ZamanCizelgesi({ bloklar }: { bloklar: Blok[] }) {
  const olaylar = bloklar
    .flatMap((blok) =>
      (blok.asamalar || [])
        .filter((a) => a.kontrol_tarihi)
        .map((a) => ({
          tarih: a.kontrol_tarihi!,
          blok: blok.blok_adi,
          asama: a.asama_tipi,
          durum: a.durum,
          sonuc: a.sonuc,
          kontrol_eden: a.kontrol_eden?.ad_soyad,
        }))
    )
    .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())

  if (olaylar.length === 0) {
    return <EmptyState baslik="Henüz hareket yok" aciklama="Aşamalar güncellendikçe burada listelenecek." />
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-[#D6DCE3]" aria-hidden />
      <ul className="space-y-4 pl-14">
        {olaylar.map((olay, i) => (
          <li key={i} className="relative">
            <div
              className={cn(
                'absolute -left-8 w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs',
                olay.sonuc === 'Uygun'
                  ? 'bg-[#1B7A4B] border-[#1B7A4B] text-white'
                  : olay.sonuc === 'Hatalı'
                  ? 'bg-[#B3261E] border-[#B3261E] text-white'
                  : 'bg-white border-[#D6DCE3]'
              )}
              aria-hidden
            >
              {olay.sonuc === 'Uygun' ? '✓' : olay.sonuc === 'Hatalı' ? '✕' : '●'}
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F1F33]">
                {olay.blok} — {olay.asama}
              </p>
              <p className="text-xs text-[#6B7785]">
                {formatTarihSaat(olay.tarih)}
                {olay.kontrol_eden && ` · ${olay.kontrol_eden}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-[#F5F7F9] last:border-0">
      <dt className="text-[#6B7785] flex-shrink-0">{label}</dt>
      <dd className={cn(
        'text-[#0F1F33] text-right',
        mono ? 'font-mono' : ''
      )} style={mono ? { fontFamily: 'IBM Plex Mono, monospace' } : {}}>
        {value}
      </dd>
    </div>
  )
}
