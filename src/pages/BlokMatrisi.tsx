/**
 * Blok Matrisi — Proje Detayı'nın b) sekmesinde kullanılır.
 * Bağımsız bileşen olarak da import edilebilir.
 * Spec §7.4b, §10 (erişilebilirlik), §6 (yetki)
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Check, X, Circle, Loader2,
  AlertCircle, Info, Pencil
} from 'lucide-react'
import { useUpdateAsama } from '@/hooks/useProjects'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Select, Textarea } from '@/components/ui/FormField'
import { Badge, AsamaBadge } from '@/components/ui/Badge'
import { formatTarihSaat, oncekiAsamaTamamMi, cn } from '@/lib/utils'
import { ASAMA_SIRALAMA, ASAMA_KISA, type AsamaTipi, type AsamaDurumu, type AsamaSonucu } from '@/lib/types'
import type { Blok, BlokAsamasi } from '@/lib/types'

interface BlokMatrisiProps {
  bloklar: Blok[]
  projeId: string
  yazabilir: boolean
  yonetici: boolean
}

interface AsamaSecimi {
  asama: BlokAsamasi
  blok: Blok
}

export function BlokMatrisi({ bloklar, projeId, yazabilir, yonetici }: BlokMatrisiProps) {
  const { kullanici } = useAuth()
  const updateAsama = useUpdateAsama()

  // Seçilen hücre (panel için)
  const [secilen, setSecilen] = useState<AsamaSecimi | null>(null)
  // Toplu seçim: blok id'leri
  const [topluSecim, setTopluSecim] = useState<Set<string>>(new Set())
  // Toplu işlem aşaması
  const [topluAsama, setTopluAsama] = useState<AsamaTipi | null>(null)
  const [topluModal, setTopluModal] = useState(false)
  // Klavye gezinme için aktif hücre [blokIndex, asamaIndex]
  const [aktifHucre, setAktifHucre] = useState<[number, number]>([0, 0])
  const tabloRef = useRef<HTMLTableElement>(null)

  // Sütun sayaçları
  const sayaclar = ASAMA_SIRALAMA.map(tip => ({
    tip,
    toplam: bloklar.length,
    uygun: bloklar.filter(b => b.asamalar?.find(a => a.asama_tipi === tip)?.sonuc === 'Uygun').length,
    hatali: bloklar.filter(b => b.asamalar?.find(a => a.asama_tipi === tip)?.sonuc === 'Hatalı').length,
  }))

  // Toplu seçim toggle
  function toggleBlok(blokId: string) {
    setTopluSecim(prev => {
      const next = new Set(prev)
      if (next.has(blokId)) next.delete(blokId)
      else next.add(blokId)
      return next
    })
  }

  function tumunuSec() {
    if (topluSecim.size === bloklar.length) {
      setTopluSecim(new Set())
    } else {
      setTopluSecim(new Set(bloklar.map(b => b.id)))
    }
  }

  // Klavye gezinme
  const handleKeyDown = useCallback((e: React.KeyboardEvent, bi: number, ai: number) => {
    const maxBi = bloklar.length - 1
    const maxAi = ASAMA_SIRALAMA.length - 1
    let nextBi = bi, nextAi = ai
    switch (e.key) {
      case 'ArrowDown':  e.preventDefault(); nextBi = Math.min(maxBi, bi + 1); break
      case 'ArrowUp':    e.preventDefault(); nextBi = Math.max(0, bi - 1); break
      case 'ArrowRight': e.preventDefault(); nextAi = Math.min(maxAi, ai + 1); break
      case 'ArrowLeft':  e.preventDefault(); nextAi = Math.max(0, ai - 1); break
      case 'Enter': {
        e.preventDefault()
        const blok = bloklar[bi]
        const asama = blok.asamalar?.find(a => a.asama_tipi === ASAMA_SIRALAMA[ai])
        if (asama && yazabilir) setSecilen({ asama, blok })
        return
      }
      default: return
    }
    setAktifHucre([nextBi, nextAi])
    // Odağı taşı
    const hucre = tabloRef.current?.querySelector<HTMLElement>(
      `[data-hucre="${nextBi}-${nextAi}"]`
    )
    hucre?.focus()
  }, [bloklar, yazabilir])

  return (
    <div>
      {/* Toplu işlem araç çubuğu */}
      {topluSecim.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-3 py-2 bg-[#1B4B73]/5 border border-[#1B4B73]/20 rounded">
          <span className="text-sm font-medium text-[#1B4B73]">
            {topluSecim.size} blok seçili
          </span>
          <Select
            value={topluAsama || ''}
            onChange={e => setTopluAsama(e.target.value as AsamaTipi)}
            className="h-8 text-sm w-44"
            aria-label="Toplu işaretlenecek aşama"
          >
            <option value="">Aşama seç…</option>
            {ASAMA_SIRALAMA.map(tip => <option key={tip} value={tip}>{tip}</option>)}
          </Select>
          <Button
            size="sm"
            variant="secondary"
            disabled={!topluAsama}
            onClick={() => topluAsama && setTopluModal(true)}
          >
            İşaretle
          </Button>
          <button
            onClick={() => setTopluSecim(new Set())}
            className="text-xs text-[#6B7785] hover:text-[#B3261E] ml-auto"
          >
            Seçimi temizle
          </button>
        </div>
      )}

      {/* Matris tablosu */}
      <div className="table-scroll" role="region" aria-label="Blok ilerleme matrisi">
        <table
          ref={tabloRef}
          className="w-full border-collapse"
          aria-label={`${bloklar.length} blok, 5 aşama`}
        >
          <thead>
            <tr>
              {/* Seçim sütunu */}
              <th scope="col" className="px-3 py-2 text-left w-10 sticky left-0 bg-white z-10 border-b border-[#D6DCE3]">
                {yazabilir && (
                  <input
                    type="checkbox"
                    checked={topluSecim.size === bloklar.length && bloklar.length > 0}
                    onChange={tumunuSec}
                    className="w-4 h-4"
                    aria-label="Tümünü seç"
                  />
                )}
              </th>
              {/* Blok adı sütunu */}
              <th scope="col"
                className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide min-w-[100px] sticky left-10 bg-white z-10 border-b border-[#D6DCE3]">
                Blok
              </th>
              {/* Aşama sütunları */}
              {ASAMA_SIRALAMA.map(tip => (
                <th key={tip} scope="col"
                  className="px-2 py-2 text-center text-xs font-semibold text-[#6B7785] uppercase tracking-wide min-w-[110px] border-b border-[#D6DCE3]">
                  {ASAMA_KISA[tip]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-live="polite" aria-atomic="false">
            {bloklar.map((blok, bi) => (
              <tr
                key={blok.id}
                className={cn(
                  'border-b border-[#D6DCE3] transition-colors',
                  topluSecim.has(blok.id) ? 'bg-[#1B4B73]/5' : 'hover:bg-[#F5F7F9]'
                )}
              >
                {/* Seçim kutusu */}
                <td className="px-3 py-1 sticky left-0 bg-inherit z-10">
                  {yazabilir && (
                    <input
                      type="checkbox"
                      checked={topluSecim.has(blok.id)}
                      onChange={() => toggleBlok(blok.id)}
                      className="w-4 h-4"
                      aria-label={`${blok.blok_adi} seç`}
                    />
                  )}
                </td>
                {/* Blok adı — düzenlenebilir */}
                <th scope="row"
                  className="px-3 py-2 text-sm font-semibold text-[#0F1F33] text-left sticky left-10 bg-inherit z-10">
                  <BlokAdiDuzenle
                    blokId={blok.id}
                    projeId={projeId}
                    mevcutAd={blok.blok_adi}
                    yazabilir={yazabilir}
                  />
                </th>
                {/* Aşama hücreleri */}
                {ASAMA_SIRALAMA.map((tip, ai) => {
                  const asama = blok.asamalar?.find(a => a.asama_tipi === tip)
                  const aktif = aktifHucre[0] === bi && aktifHucre[1] === ai
                  return (
                    <td key={tip} className="px-1 py-1 text-center">
                      <button
                        data-hucre={`${bi}-${ai}`}
                        onClick={() => asama && yazabilir && setSecilen({ asama, blok })}
                        onKeyDown={e => handleKeyDown(e, bi, ai)}
                        disabled={!yazabilir || !asama}
                        tabIndex={aktif ? 0 : -1}
                        className={cn(
                          'inline-flex items-center justify-center min-w-[100px] min-h-[44px] px-2 py-1.5 rounded transition-colors',
                          yazabilir && asama ? 'hover:bg-[#F5F7F9] cursor-pointer' : 'cursor-default',
                          aktif ? 'ring-2 ring-[#B4531F]' : ''
                        )}
                        aria-label={`${blok.blok_adi} — ${tip}: ${asama?.durum || 'bilinmiyor'}${asama?.sonuc ? ` (${asama.sonuc})` : ''}`}
                        aria-pressed={secilen?.asama.id === asama?.id}
                      >
                        {asama
                          ? <AsamaBadge durum={asama.durum} sonuc={asama.sonuc} />
                          : <span className="text-xs text-[#D6DCE3]">—</span>
                        }
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {/* Sütun sayaçları */}
          <tfoot>
            <tr className="bg-[#F5F7F9] border-t-2 border-[#D6DCE3]">
              <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-[#6B7785] sticky left-0 bg-[#F5F7F9] z-10">
                Toplam
              </td>
              {sayaclar.map(s => (
                <td key={s.tip} className="px-2 py-2 text-center">
                  <span className="text-xs font-mono font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>
                    <span className="text-[#1B7A4B]">{s.uygun}</span>
                    <span className="text-[#D6DCE3]">/</span>
                    <span className="text-[#0F1F33]">{s.toplam}</span>
                    {s.hatali > 0 && (
                      <span className="text-[#B3261E] ml-1">· {s.hatali}⚑</span>
                    )}
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Klavye yardımı */}
      <p className="text-xs text-[#6B7785] mt-2 flex items-center gap-1">
        <Info size={12} aria-hidden />
        Ok tuşlarıyla gezin · Enter ile düzenle · Space ile seç
      </p>

      {/* ── Aşama Düzenleme Paneli ── */}
      {secilen && (
        <AsamaPanel
          asama={secilen.asama}
          blok={secilen.blok}
          projeId={projeId}
          yazabilir={yazabilir}
          yonetici={yonetici}
          isPending={updateAsama.isPending}
          allAsamalar={secilen.blok.asamalar || []}
          onKapat={() => setSecilen(null)}
          onKaydet={async (durum, sonuc, aciklama) => {
            await updateAsama.mutateAsync({
              asamaId: secilen.asama.id,
              projeId,
              durum,
              sonuc,
              aciklama,
              mevcutSurum: secilen.asama.surum,
            })
            setSecilen(null)
          }}
        />
      )}

      {/* ── Toplu İşlem Onay Modali ── */}
      {topluModal && topluAsama && (
        <TopluIslemModal
          bloklar={bloklar.filter(b => topluSecim.has(b.id))}
          asamaTipi={topluAsama}
          projeId={projeId}
          onKapat={() => setTopluModal(false)}
          onTamamla={() => {
            setTopluModal(false)
            setTopluSecim(new Set())
            setTopluAsama(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Aşama Düzenleme Paneli ───────────────────────────────────
function AsamaPanel({
  asama, blok, projeId, yazabilir, yonetici, isPending,
  allAsamalar, onKapat, onKaydet,
}: {
  asama: BlokAsamasi; blok: Blok; projeId: string
  yazabilir: boolean; yonetici: boolean; isPending: boolean
  allAsamalar: BlokAsamasi[]
  onKapat: () => void
  onKaydet: (durum: AsamaDurumu, sonuc?: AsamaSonucu, aciklama?: string) => Promise<void>
}) {
  const [durum, setDurum] = useState<AsamaDurumu>(asama.durum)
  const [sonuc, setSonuc] = useState<AsamaSonucu | ''>((asama.sonuc as AsamaSonucu) || '')
  const [aciklama, setAciklama] = useState(asama.aciklama || '')
  const [kuralAsilmaOnay, setKuralAsilmaOnay] = useState(false)
  const [hatalar, setHatalar] = useState<Record<string, string>>({})

  const oncekiTamamMi = oncekiAsamaTamamMi(allAsamalar, asama.sira_no)
  const kuralIhlali = durum === 'Tamamlandı' && !oncekiTamamMi && asama.sira_no > 1

  const oncekiAsamaAdi = asama.sira_no > 1 ? ASAMA_SIRALAMA[asama.sira_no - 2] : null

  function dogrula(): boolean {
    const h: Record<string, string> = {}
    if (durum === 'Tamamlandı' && !sonuc) {
      h.sonuc = 'Sonuç seçilmelidir: Uygun veya Hatalı.'
    }
    if (sonuc === 'Hatalı' && aciklama.trim().length < 10) {
      h.aciklama = 'Hatalı işaretleme için en az 10 karakter açıklama gereklidir.'
    }
    if (kuralIhlali && !kuralAsilmaOnay) {
      h.kural = `${oncekiAsamaAdi} tamamlanmadan ${asama.asama_tipi} kapatılamaz.${yonetici ? ' Gerekçe yazarak devam edebilirsiniz.' : ' Önce önceki aşamayı kapatın.'}`
    }
    setHatalar(h)
    return Object.keys(h).length === 0
  }

  async function kaydet() {
    if (!dogrula()) return
    await onKaydet(
      durum,
      durum === 'Tamamlandı' ? (sonuc as AsamaSonucu) : undefined,
      aciklama || undefined
    )
  }

  return (
    <>
      {/* Arka plan */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onKapat} aria-hidden />
      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 w-full md:w-[440px] bg-white border-l border-[#D6DCE3] z-50 flex flex-col slide-in-right"
        role="dialog" aria-modal="true"
        aria-labelledby="asama-panel-baslik"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D6DCE3]">
          <div>
            <h2 id="asama-panel-baslik"
              className="text-base font-semibold text-[#0F1F33]"
              style={{ fontFamily: 'Archivo' }}>
              {blok.blok_adi} — {asama.asama_tipi}
            </h2>
            <p className="text-xs text-[#6B7785]">Aşama {asama.sira_no} / 5</p>
          </div>
          <button onClick={onKapat}
            className="p-2 rounded hover:bg-[#F5F7F9] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Paneli kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Mevcut durum */}
          <div className="flex items-center gap-2 p-3 bg-[#F5F7F9] rounded">
            <span className="text-xs text-[#6B7785]">Mevcut:</span>
            <AsamaBadge durum={asama.durum} sonuc={asama.sonuc} />
            {asama.kontrol_tarihi && (
              <span className="text-xs text-[#6B7785] ml-auto font-mono"
                style={{ fontFamily: 'IBM Plex Mono' }}>
                {formatTarihSaat(asama.kontrol_tarihi)}
              </span>
            )}
          </div>

          {/* Sıra kuralı uyarısı */}
          {kuralIhlali && (
            <div className="bg-amber-50 border border-[#9A6700]/30 rounded p-3" role="alert">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-[#9A6700] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#9A6700]">Sıra kuralı</p>
                  <p className="text-xs text-[#9A6700] mt-0.5">
                    <strong>{oncekiAsamaAdi}</strong> aşaması Uygun olarak kapatılmadan bu aşama tamamlanamaz.
                  </p>
                  {yonetici && (
                    <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={kuralAsilmaOnay}
                        onChange={e => setKuralAsilmaOnay(e.target.checked)} className="w-4 h-4" />
                      Gerekçe yazarak sırayı aşıyorum (log'a yazılır)
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {yazabilir && (
            <>
              {/* Durum seçimi */}
              <FormField label="Durum" required>
                {(id) => (
                  <Select id={id} value={durum}
                    onChange={e => {
                      setDurum(e.target.value as AsamaDurumu)
                      if (e.target.value !== 'Tamamlandı') setSonuc('')
                    }}>
                    <option value="Başlamadı">Başlamadı</option>
                    <option value="Devam Ediyor">Devam Ediyor</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                  </Select>
                )}
              </FormField>

              {/* Sonuç seçimi — büyük butonlar, 44px min */}
              {durum === 'Tamamlandı' && (
                <fieldset>
                  <legend className="text-sm font-medium text-[#0F1F33] mb-2">
                    Sonuç <span className="text-[#B3261E]" aria-hidden>*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3" role="radiogroup">
                    {(['Uygun', 'Hatalı'] as AsamaSonucu[]).map(s => (
                      <label key={s}
                        className={cn(
                          'flex items-center justify-center gap-2 p-3 rounded border-2 cursor-pointer min-h-[56px] text-sm font-medium transition-colors',
                          sonuc === s
                            ? s === 'Uygun'
                              ? 'border-[#1B7A4B] bg-[#1B7A4B]/10 text-[#1B7A4B]'
                              : 'border-[#B3261E] bg-[#B3261E]/10 text-[#B3261E]'
                            : 'border-[#D6DCE3] hover:border-[#6B7785]'
                        )}>
                        <input type="radio" name="sonuc" value={s}
                          checked={sonuc === s} onChange={() => setSonuc(s)} className="sr-only" />
                        {s === 'Uygun'
                          ? <Check size={16} aria-hidden />
                          : <X size={16} aria-hidden />
                        }
                        {s}
                      </label>
                    ))}
                  </div>
                  {hatalar.sonuc && (
                    <p className="text-xs text-[#B3261E] mt-1" role="alert">{hatalar.sonuc}</p>
                  )}
                </fieldset>
              )}

              {/* Açıklama */}
              <FormField
                label="Açıklama"
                required={sonuc === 'Hatalı'}
                error={hatalar.aciklama}
                hint={sonuc === 'Hatalı' ? 'Hatalı işaretleme için en az 10 karakter gereklidir.' : undefined}
              >
                {(id, describedBy) => (
                  <Textarea id={id} value={aciklama}
                    onChange={e => setAciklama(e.target.value)}
                    placeholder="Kontrol notları, tespitler, yapılan işlemler…"
                    aria-describedby={describedBy}
                    error={!!hatalar.aciklama}
                    rows={3} />
                )}
              </FormField>

              {hatalar.kural && (
                <p className="text-xs text-[#9A6700]" role="alert">{hatalar.kural}</p>
              )}
            </>
          )}

          {/* Geçmiş bilgisi */}
          {asama.kontrol_eden && (
            <div className="text-xs text-[#6B7785] border-t border-[#D6DCE3] pt-3">
              <p>Son kontrol: <strong className="text-[#0F1F33]">{asama.kontrol_eden.ad_soyad}</strong></p>
              <p className="font-mono mt-0.5" style={{ fontFamily: 'IBM Plex Mono' }}>
                {formatTarihSaat(asama.kontrol_tarihi)}
              </p>
              {asama.kontrol_sayisi > 1 && (
                <p className="mt-0.5">Toplam kontrol: <strong>{asama.kontrol_sayisi}</strong></p>
              )}
            </div>
          )}
        </div>

        {/* Alt butonlar */}
        {yazabilir && (
          <div className="px-5 py-4 border-t border-[#D6DCE3] flex gap-3">
            <Button variant="outline" onClick={onKapat} className="flex-1">
              İptal
            </Button>
            <Button
              variant="primary"
              onClick={kaydet}
              loading={isPending}
              disabled={kuralIhlali && !yonetici}
              className="flex-1"
            >
              Aşamayı kaydet
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Toplu İşlem Modalı ───────────────────────────────────────
function TopluIslemModal({
  bloklar, asamaTipi, projeId, onKapat, onTamamla,
}: {
  bloklar: Blok[]; asamaTipi: AsamaTipi; projeId: string
  onKapat: () => void; onTamamla: () => void
}) {
  const updateAsama = useUpdateAsama()
  const [sonuc, setSonuc] = useState<AsamaSonucu | ''>('')
  const [aciklama, setAciklama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function kaydet() {
    if (!sonuc) { setHata('Sonuç seçilmelidir.'); return }
    if (sonuc === 'Hatalı' && aciklama.trim().length < 10) {
      setHata('Hatalı için en az 10 karakter açıklama gerekli.')
      return
    }
    setYukleniyor(true)
    try {
      for (const blok of bloklar) {
        const asama = blok.asamalar?.find(a => a.asama_tipi === asamaTipi)
        if (!asama) continue
        await updateAsama.mutateAsync({
          asamaId: asama.id,
          projeId,
          durum: 'Tamamlandı',
          sonuc: sonuc as AsamaSonucu,
          aciklama: aciklama || undefined,
          mevcutSurum: asama.surum,
        })
      }
      onTamamla()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir hata oluştu.')
    }
    setYukleniyor(false)
  }

  return (
    <Modal acik kapat={onKapat}
      baslik={`Toplu işaret: ${ASAMA_KISA[asamaTipi]}`} genislik="md">
      <div className="space-y-4">
        <div className="bg-[#F5F7F9] rounded p-3">
          <p className="text-sm font-medium text-[#0F1F33] mb-1">
            {bloklar.length} blok işaretlenecek:
          </p>
          <div className="flex flex-wrap gap-1">
            {bloklar.map(b => (
              <Badge key={b.id} variant="info">{b.blok_adi}</Badge>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#0F1F33] mb-2">
            Sonuç <span className="text-[#B3261E]">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(['Uygun', 'Hatalı'] as AsamaSonucu[]).map(s => (
              <label key={s} className={cn(
                'flex items-center justify-center gap-2 p-3 rounded border-2 cursor-pointer min-h-[52px] text-sm font-medium transition-colors',
                sonuc === s
                  ? s === 'Uygun' ? 'border-[#1B7A4B] bg-[#1B7A4B]/10 text-[#1B7A4B]'
                    : 'border-[#B3261E] bg-[#B3261E]/10 text-[#B3261E]'
                  : 'border-[#D6DCE3] hover:border-[#6B7785]'
              )}>
                <input type="radio" name="toplu-sonuc" value={s}
                  checked={sonuc === s} onChange={() => setSonuc(s)} className="sr-only" />
                {s === 'Uygun' ? <Check size={16} /> : <X size={16} />} {s}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField label="Açıklama" required={sonuc === 'Hatalı'}>
          {(id) => (
            <Textarea id={id} value={aciklama}
              onChange={e => setAciklama(e.target.value)}
              placeholder="Ortak not veya tespit…" rows={2} />
          )}
        </FormField>

        {hata && <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onKapat} className="flex-1">İptal</Button>
          <Button variant="primary" onClick={kaydet} loading={yukleniyor} className="flex-1">
            {bloklar.length} bloğu işaretle
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Blok adı düzenleme bileşeni ─────────────────────────────
function BlokAdiDuzenle({
  blokId, projeId, mevcutAd, yazabilir,
}: {
  blokId: string; projeId: string; mevcutAd: string; yazabilir: boolean
}) {
  const queryClient = useQueryClient()
  const [duzenleMode, setDuzenleMode] = useState(false)
  const [deger, setDeger] = useState(mevcutAd)
  const [yukleniyor, setYukleniyor] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDeger(mevcutAd) }, [mevcutAd])

  useEffect(() => {
    if (duzenleMode) inputRef.current?.focus()
  }, [duzenleMode])

  async function kaydet() {
    const temiz = deger.trim()
    if (!temiz || temiz === mevcutAd) { setDuzenleMode(false); setDeger(mevcutAd); return }
    setYukleniyor(true)
    await supabase.from('bloklar').update({ blok_adi: temiz }).eq('id', blokId)
    queryClient.invalidateQueries({ queryKey: ['proje', projeId] })
    setYukleniyor(false)
    setDuzenleMode(false)
  }

  function iptal() { setDeger(mevcutAd); setDuzenleMode(false) }

  if (duzenleMode) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={deger}
          onChange={e => setDeger(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') kaydet(); if (e.key === 'Escape') iptal() }}
          className="w-28 px-1.5 py-1 text-sm border border-[#B4531F] rounded focus:outline-none font-semibold"
          aria-label="Blok adını düzenle"
          maxLength={20}
        />
        <button onClick={kaydet} disabled={yukleniyor}
          className="p-1 text-[#1B7A4B] hover:bg-[#1B7A4B]/10 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
          aria-label="Kaydet">
          {yukleniyor ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={iptal}
          className="p-1 text-[#B3261E] hover:bg-[#B3261E]/10 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
          aria-label="İptal">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group whitespace-nowrap">
      <span>{mevcutAd}</span>
      {yazabilir && (
        <button
          onClick={() => setDuzenleMode(true)}
          className="p-1 text-[#D6DCE3] hover:text-[#6B7785] opacity-0 group-hover:opacity-100 transition-opacity rounded min-w-[24px] min-h-[24px] flex items-center justify-center"
          aria-label={`${mevcutAd} adını düzenle`}
        >
          <Pencil size={11} aria-hidden />
        </button>
      )}
    </div>
  )
}
