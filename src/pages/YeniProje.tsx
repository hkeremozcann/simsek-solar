import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select } from '@/components/ui/FormField'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { useFirmalar, useKullanicilar, useBayiler, useCreateProject } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { TURKIYE_ILLERI, KURUM_TIPLERI, type KurumTipi, type ProjeKapsami } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Malzeme tablosu satırı ───────────────────────────────────
interface MalzemeGirisi {
  malzeme_id: string
  ad: string
  varyant: string | null
  birim: string
  adet: number
}

// ─── Form verisi ──────────────────────────────────────────────
interface FormData {
  // Adım 1: Firma & Kapsam
  firma_id: string
  yeni_firma_adi: string
  kurum_tipi: KurumTipi
  bayi_id: string
  satis_temsilcisi_id: string
  // Adım 2: Saha & Malzeme
  il: string
  ilce: string
  blok_sayisi: number
  malzemeler: MalzemeGirisi[]
  // Adım 3: Kapsam & Kişiler
  montaj_kapsami: ProjeKapsami[]
  santiye_yetkili_ad: string
  santiye_yetkili_tel: string
  santiye_yetkili_eposta: string
  rapor_epostasi: string
  notlar: string
  // Adım 4: Özet (sadece görüntüleme)
  proje_adi: string
}

const ADIMLAR = ['Firma & Kapsam', 'Saha & Malzeme', 'Kişiler', 'Özet']

// Kilitli kapsam (her projede zorunlu, değiştirilemez)
const KILITLI_KAPSAM: ProjeKapsami[] = ['Malzeme Satışı', 'Proje Desteği']
// Seçilebilir kapsam
const SECILIR_KAPSAM: { deger: ProjeKapsami; etiket: string }[] = [
  { deger: 'Panel Dizilim Montajı', etiket: 'Dizilim Montajı' },
  { deger: 'Borulama Montajı', etiket: 'Borulama Montajı' },
  { deger: 'Pano Montajı', etiket: 'Pano Montajı' },
  { deger: 'Devreye Alma', etiket: 'Devreye Alma' },
]

function useMalzemeler() {
  return useQuery({
    queryKey: ['malzemeler-tanim'],
    queryFn: async () => {
      const { data } = await supabase.from('malzemeler').select('*').eq('aktif_mi', true).order('kategori').order('ad')
      return data ?? []
    },
  })
}

export default function YeniProje() {
  const navigate = useNavigate()
  const { kullanici } = useAuth()
  const [adim, setAdim] = useState(1)
  const [hatalar, setHatalar] = useState<Record<string, string>>({})

  const { data: firmalar = [] } = useFirmalar()
  const { data: kullanicilarRaw = [] } = useKullanicilar()
  const { data: bayiler = [] } = useBayiler()
  const { data: malzemelerTablosu = [] } = useMalzemeler()
  const createProject = useCreateProject()

  // Mevcut kullanıcıyı listeye ekle
  const kullanicilar = useMemo(() => {
    const liste = kullanicilarRaw.filter(k =>
      ['yonetici', 'satis_sonrasi_sorumlusu', 'satis_temsilcisi'].includes(k.rol)
    )
    if (kullanici && !liste.find(k => k.id === kullanici.id)) {
      return [kullanici, ...liste]
    }
    return liste.length > 0 ? liste : kullanici ? [kullanici] : []
  }, [kullanicilarRaw, kullanici])

  const [form, setForm] = useState<FormData>({
    firma_id: '', yeni_firma_adi: '', kurum_tipi: 'TOKİ',
    bayi_id: '', satis_temsilcisi_id: '',
    il: '', ilce: '', blok_sayisi: 1, malzemeler: [],
    montaj_kapsami: [], santiye_yetkili_ad: '', santiye_yetkili_tel: '',
    santiye_yetkili_eposta: '', rapor_epostasi: '', notlar: '', proje_adi: '',
  })

  // Malzeme listesi hazır olunca form'a başlangıç değerleri koy
  useEffect(() => {
    if (malzemelerTablosu.length > 0 && form.malzemeler.length === 0) {
      setForm(f => ({
        ...f,
        malzemeler: malzemelerTablosu.map(m => ({
          malzeme_id: m.id,
          ad: m.ad,
          varyant: m.varyant,
          birim: m.birim,
          adet: 0,
        })),
      }))
    }
  }, [malzemelerTablosu])

  // Temsilci otomatik seç
  useEffect(() => {
    if (kullanici && !form.satis_temsilcisi_id) {
      setForm(f => ({ ...f, satis_temsilcisi_id: kullanici.id }))
    }
  }, [kullanici])

  // Proje adı otomatik üret
  useEffect(() => {
    const firma = firmalar.find(f => f.id === form.firma_id)
    if (firma && form.il && form.kurum_tipi) {
      setForm(f => ({
        ...f,
        proje_adi: `${firma.ad} — ${f.il} Güneş Enerjisi Sistemi`,
      }))
    }
  }, [form.firma_id, form.il, form.kurum_tipi, firmalar])

  function g<K extends keyof FormData>(alan: K, deger: FormData[K]) {
    setForm(prev => ({ ...prev, [alan]: deger }))
    setHatalar(prev => { const h = { ...prev }; delete h[alan as string]; return h })
  }

  // Kollektör toplamı
  const toplamKollektor = form.malzemeler
    .filter(m => m.ad === 'Kollektör')
    .reduce((s, m) => s + m.adet, 0)

  const blokBasinaKollektor = form.blok_sayisi > 0 && toplamKollektor > 0
    ? Math.round(toplamKollektor / form.blok_sayisi)
    : null

  const kolektorUyarisi = blokBasinaKollektor !== null
    && (blokBasinaKollektor < 8 || blokBasinaKollektor > 250)

  function adimDogrula(): boolean {
    const h: Record<string, string> = {}
    if (adim === 1) {
      if (!form.firma_id && !form.yeni_firma_adi) h.firma = 'Firma seçin veya yeni firma adı girin.'
      if (!form.satis_temsilcisi_id) h.satis_temsilcisi_id = 'Satış temsilcisi zorunludur.'
    }
    if (adim === 2) {
      if (!form.il) h.il = 'İl seçimi zorunludur.'
      if (form.blok_sayisi < 1) h.blok_sayisi = 'En az 1 blok olmalıdır.'
    }
    if (adim === 3) {
      if (form.montaj_kapsami.length === 0) h.montaj_kapsami = 'En az bir montaj kapsamı seçin.'
    }
    setHatalar(h)
    return Object.keys(h).length === 0
  }

  async function handleKaydet() {
    setHatalar({})
    try {
      // Firma oluştur
      let firmaId = form.firma_id
      if (form.firma_id === 'yeni' || (!form.firma_id && form.yeni_firma_adi)) {
        const { data: yf, error: fErr } = await supabase
          .from('firmalar')
          .insert({ ad: form.yeni_firma_adi, kurum_tipi: form.kurum_tipi, aktif_mi: true, silindi_mi: false })
          .select('id').single()
        if (fErr) throw fErr
        firmaId = yf.id
      }

      // Tüm kapsam = kilitli + seçilenler
      const tamKapsam: ProjeKapsami[] = [...KILITLI_KAPSAM, ...form.montaj_kapsami]

      const result = await createProject.mutateAsync({
        proje: {
          proje_adi: form.proje_adi || `${form.il} Güneş Enerjisi Sistemi`,
          firma_id: firmaId,
          santiye_adresi: form.il + (form.ilce ? ` / ${form.ilce}` : ''),
          il: form.il,
          ilce: form.ilce || undefined,
          satis_temsilcisi_id: form.satis_temsilcisi_id,
          bayi_id: form.bayi_id || undefined,
          montaj_kapsami: tamKapsam,
          blok_sayisi: form.blok_sayisi,
          toplam_kollektor_sayisi: toplamKollektor,
          toplam_sehpa_sayisi: form.malzemeler
            .filter(m => m.ad.includes('Sehpa'))
            .reduce((s, m) => s + m.adet, 0),
          notlar: form.notlar || undefined,
        } as Parameters<typeof createProject.mutateAsync>[0]['proje'],
        blokAdlandirmaTipi: 'sayi',
        santiyeYetkilileri: form.santiye_yetkili_ad ? [{
          ad_soyad: form.santiye_yetkili_ad,
          gorevi: 'Şantiye Şefi',
          telefon: form.santiye_yetkili_tel,
          eposta: form.santiye_yetkili_eposta,
          birincil_mi: true,
        }] : [],
        raporAlicilari: form.rapor_epostasi ? [{
          eposta: form.rapor_epostasi,
          ad_soyad: form.santiye_yetkili_ad,
          alici_tipi: 'Kime' as const,
        }] : [],
      })

      // Malzeme kayıtları
      const malzemeKayitlari = form.malzemeler
        .filter(m => m.adet > 0)
        .map(m => ({
          proje_id: result.id,
          malzeme_id: m.malzeme_id,
          sozlesme_adedi: m.adet,
        }))

      if (malzemeKayitlari.length > 0) {
        await supabase.from('proje_malzemeleri').insert(malzemeKayitlari)
      }

      // kurum_tipi projeye yaz
      await supabase.from('projeler')
        .update({ kurum_tipi: form.kurum_tipi })
        .eq('id', result.id)

      navigate(`/projeler/${result.id}`)
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : null)
        || (err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message) : null)
        || JSON.stringify(err)
      setHatalar({ genel: msg })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader baslik="Yeni proje ekle" aciklama="Proje bilgilerini adım adım doldurun." />

      {/* İlerleme */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-3">
        <ol className="flex gap-2 md:gap-6">
          {ADIMLAR.map((label, i) => {
            const no = i + 1
            const tamamlandi = no < adim
            const aktif = no === adim
            return (
              <li key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  tamamlandi ? 'bg-[#1B7A4B] border-[#1B7A4B] text-white'
                  : aktif ? 'border-[#B4531F] text-[#B4531F]'
                  : 'border-[#D6DCE3] text-[#6B7785]'
                }`} aria-current={aktif ? 'step' : undefined}>
                  {tamamlandi ? '✓' : no}
                </div>
                <span className={`hidden md:inline text-sm ${aktif ? 'font-medium text-[#0F1F33]' : 'text-[#6B7785]'}`}>
                  {label}
                </span>
                {i < ADIMLAR.length - 1 && (
                  <div className="hidden md:block w-8 h-px bg-[#D6DCE3] ml-2" aria-hidden />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="p-4 md:p-6 max-w-2xl">

        {/* ── Adım 1: Firma & Kapsam ── */}
        {adim === 1 && (
          <section className="space-y-4" aria-labelledby="adim1">
            <h2 id="adim1" className="text-base font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Firma ve kurum bilgileri
            </h2>

            <FormField label="Firma" required error={hatalar.firma}>
              {(id, describedBy) => (
                <Select id={id} value={form.firma_id}
                  onChange={e => g('firma_id', e.target.value)}
                  aria-describedby={describedBy} error={!!hatalar.firma}>
                  <option value="">— Firma seçin —</option>
                  {firmalar.map(f => <option key={f.id} value={f.id}>{f.ad}</option>)}
                  <option value="yeni">+ Yeni firma ekle</option>
                </Select>
              )}
            </FormField>

            {(form.firma_id === 'yeni' || (!form.firma_id && form.yeni_firma_adi)) && (
              <FormField label="Yeni firma adı" required>
                {(id) => (
                  <Input id={id} value={form.yeni_firma_adi}
                    onChange={e => g('yeni_firma_adi', e.target.value)}
                    placeholder="örn. Özgün İnşaat A.Ş." />
                )}
              </FormField>
            )}

            <FormField label="Kurum tipi" required>
              {(id) => (
                <Select id={id} value={form.kurum_tipi} onChange={e => g('kurum_tipi', e.target.value as KurumTipi)}>
                  {KURUM_TIPLERI.map(k => <option key={k} value={k}>{k}</option>)}
                </Select>
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Satış temsilcisi" required error={hatalar.satis_temsilcisi_id}>
                {(id, describedBy) => (
                  <Select id={id} value={form.satis_temsilcisi_id}
                    onChange={e => g('satis_temsilcisi_id', e.target.value)}
                    aria-describedby={describedBy} error={!!hatalar.satis_temsilcisi_id}>
                    <option value="">— Seçin —</option>
                    {kullanicilar.map(k => <option key={k.id} value={k.id}>{k.ad_soyad}</option>)}
                  </Select>
                )}
              </FormField>
              <FormField label="Bayi">
                {(id) => (
                  <Select id={id} value={form.bayi_id} onChange={e => g('bayi_id', e.target.value)}>
                    <option value="">— Direkt satış —</option>
                    {bayiler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                  </Select>
                )}
              </FormField>
            </div>
          </section>
        )}

        {/* ── Adım 2: Saha & Malzeme ── */}
        {adim === 2 && (
          <section className="space-y-4" aria-labelledby="adim2">
            <h2 id="adim2" className="text-base font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Saha ve malzeme bilgileri
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="İl" required error={hatalar.il}>
                {(id, describedBy) => (
                  <Select id={id} value={form.il} onChange={e => g('il', e.target.value)}
                    aria-describedby={describedBy} error={!!hatalar.il}>
                    <option value="">— Seçin —</option>
                    {TURKIYE_ILLERI.sort().map(il => <option key={il} value={il}>{il}</option>)}
                  </Select>
                )}
              </FormField>
              <FormField label="İlçe">
                {(id) => (
                  <Input id={id} value={form.ilce} onChange={e => g('ilce', e.target.value)} />
                )}
              </FormField>
            </div>

            <FormField label="Blok sayısı" required error={hatalar.blok_sayisi}>
              {(id, describedBy) => (
                <Input id={id} type="number" min={1} value={form.blok_sayisi}
                  onChange={e => g('blok_sayisi', parseInt(e.target.value) || 1)}
                  aria-describedby={describedBy} error={!!hatalar.blok_sayisi} />
              )}
            </FormField>

            {/* Malzeme tablosu */}
            <div>
              <p className="text-sm font-medium text-[#0F1F33] mb-2">
                Malzeme miktarları (sözleşme adedi)
              </p>
              <div className="table-scroll border border-[#D6DCE3] rounded overflow-hidden">
                <table className="w-full text-sm" aria-label="Malzeme sözleşme miktarları">
                  <thead>
                    <tr className="bg-[#F5F7F9] border-b border-[#D6DCE3]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785]">Malzeme</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785]">Varyant</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785]">Birim</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-[#6B7785] min-w-[90px]">Adet (S)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.malzemeler.map((m, i) => (
                      <tr key={m.malzeme_id} className="border-b border-[#D6DCE3] last:border-0">
                        <td className="px-3 py-2 text-[#0F1F33]">{m.ad}</td>
                        <td className="px-3 py-2 text-[#6B7785] text-xs">{m.varyant || '—'}</td>
                        <td className="px-3 py-2 text-[#6B7785] text-xs">{m.birim}</td>
                        <td className="px-3 py-1.5 text-right">
                          <input
                            type="number"
                            min={0}
                            value={m.adet || ''}
                            onChange={e => {
                              const liste = [...form.malzemeler]
                              liste[i] = { ...m, adet: parseInt(e.target.value) || 0 }
                              g('malzemeler', liste)
                            }}
                            className="w-20 text-right px-2 py-1 border border-[#D6DCE3] rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B4531F] focus:border-transparent"
                            style={{ fontFamily: 'IBM Plex Mono' }}
                            aria-label={`${m.ad} ${m.varyant || ''} adet`}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Canlı özet */}
              {toplamKollektor > 0 && (
                <div className={cn(
                  'mt-2 p-3 rounded border text-sm',
                  kolektorUyarisi
                    ? 'bg-amber-50 border-[#9A6700]/30 text-[#9A6700]'
                    : 'bg-[#1B7A4B]/5 border-[#1B7A4B]/20 text-[#1B7A4B]'
                )}>
                  <div className="flex items-start gap-2">
                    {kolektorUyarisi && <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" aria-hidden />}
                    <div>
                      <span className="font-semibold font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
                        {toplamKollektor.toLocaleString('tr-TR')} kollektör
                      </span>
                      {blokBasinaKollektor !== null && (
                        <span className="ml-2">
                          · blok başına ~<strong>{blokBasinaKollektor}</strong> kollektör
                        </span>
                      )}
                      {kolektorUyarisi && (
                        <span className="ml-1">(alışılmadık değer, kontrol edin)</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Adım 3: Kapsam & Kişiler ── */}
        {adim === 3 && (
          <section className="space-y-4" aria-labelledby="adim3">
            <h2 id="adim3" className="text-base font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Montaj kapsamı ve kişiler
            </h2>

            {/* Kapsam seçimi */}
            <div>
              <p className="text-sm font-medium text-[#0F1F33] mb-2">
                Montaj kapsamı <span className="text-[#B3261E]" aria-hidden>*</span>
              </p>

              {/* Kilitli kapsam */}
              <div className="flex flex-wrap gap-2 mb-2">
                {KILITLI_KAPSAM.map(k => (
                  <div key={k}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#D6DCE3] bg-[#F5F7F9] text-sm text-[#6B7785] cursor-not-allowed"
                    aria-disabled="true"
                  >
                    <Lock size={11} aria-hidden />
                    {k}
                  </div>
                ))}
              </div>

              {/* Seçilebilir kapsam */}
              <div className="flex flex-wrap gap-2">
                {SECILIR_KAPSAM.map(({ deger, etiket }) => {
                  const secili = form.montaj_kapsami.includes(deger)
                  return (
                    <label key={deger} className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded border cursor-pointer text-sm transition-colors min-h-[44px]',
                      secili
                        ? 'border-[#1B4B73] bg-[#1B4B73]/10 text-[#1B4B73] font-medium'
                        : 'border-[#D6DCE3] text-[#0F1F33] hover:border-[#6B7785]'
                    )}>
                      <input type="checkbox" className="sr-only"
                        checked={secili}
                        onChange={() => {
                          const liste = secili
                            ? form.montaj_kapsami.filter(x => x !== deger)
                            : [...form.montaj_kapsami, deger]
                          g('montaj_kapsami', liste)
                        }} />
                      <span aria-hidden>{secili ? '☑' : '☐'}</span>
                      {etiket}
                    </label>
                  )
                })}
              </div>
              {hatalar.montaj_kapsami && (
                <p className="text-xs text-[#B3261E] mt-1" role="alert">{hatalar.montaj_kapsami}</p>
              )}
            </div>

            {/* Şantiye yetkilisi */}
            <Card>
              <CardHeader title="Şantiye yetkilisi" subtitle="Opsiyonel" />
              <div className="space-y-3">
                <FormField label="Ad soyad">
                  {(id) => (
                    <Input id={id} value={form.santiye_yetkili_ad}
                      onChange={e => g('santiye_yetkili_ad', e.target.value)} />
                  )}
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Telefon">
                    {(id) => (
                      <Input id={id} type="tel" value={form.santiye_yetkili_tel}
                        onChange={e => g('santiye_yetkili_tel', e.target.value)} />
                    )}
                  </FormField>
                  <FormField label="E-posta">
                    {(id) => (
                      <Input id={id} type="email" value={form.santiye_yetkili_eposta}
                        onChange={e => g('santiye_yetkili_eposta', e.target.value)} />
                    )}
                  </FormField>
                </div>
              </div>
            </Card>

            <FormField label="Rapor e-postası"
              hint="Saha raporları bu adrese gönderilecek">
              {(id, describedBy) => (
                <Input id={id} type="email" value={form.rapor_epostasi}
                  onChange={e => g('rapor_epostasi', e.target.value)}
                  aria-describedby={describedBy}
                  placeholder="yetkili@santiye.com" />
              )}
            </FormField>
          </section>
        )}

        {/* ── Adım 4: Özet ── */}
        {adim === 4 && (
          <section className="space-y-4" aria-labelledby="adim4">
            <h2 id="adim4" className="text-base font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Özet ve onay
            </h2>

            <div className="bg-[#F5F7F9] border border-[#D6DCE3] rounded p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#6B7785]">Firma:</span>
                <span className="font-medium">
                  {firmalar.find(f => f.id === form.firma_id)?.ad || form.yeni_firma_adi || '—'}
                </span>
                <span className="text-[#6B7785]">Kurum tipi:</span>
                <span>{form.kurum_tipi}</span>
                <span className="text-[#6B7785]">Şantiye:</span>
                <span>{form.il}{form.ilce ? ` / ${form.ilce}` : ''}</span>
                <span className="text-[#6B7785]">Blok sayısı:</span>
                <span className="font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>{form.blok_sayisi}</span>
                <span className="text-[#6B7785]">Oluşacak aşama:</span>
                <span className="font-mono font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>
                  {form.blok_sayisi * 5} kayıt
                </span>
                <span className="text-[#6B7785]">Toplam kollektör:</span>
                <span className="font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
                  {toplamKollektor.toLocaleString('tr-TR')}
                </span>
                <span className="text-[#6B7785]">Kapsam:</span>
                <span className="text-xs">
                  {[...KILITLI_KAPSAM, ...form.montaj_kapsami].join(', ')}
                </span>
              </div>
            </div>

            {/* Malzeme özeti */}
            {form.malzemeler.filter(m => m.adet > 0).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7785] uppercase tracking-wide mb-1">
                  Malzeme özeti
                </p>
                <ul className="space-y-1">
                  {form.malzemeler.filter(m => m.adet > 0).map(m => (
                    <li key={m.malzeme_id} className="flex justify-between text-sm">
                      <span className="text-[#6B7785]">{m.ad}{m.varyant ? ` (${m.varyant})` : ''}</span>
                      <span className="font-mono font-semibold" style={{ fontFamily: 'IBM Plex Mono' }}>
                        {m.adet.toLocaleString('tr-TR')} {m.birim}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hatalar.genel && (
              <div className="text-sm text-[#B3261E] bg-red-50 border border-[#B3261E]/20 rounded p-3" role="alert">
                {hatalar.genel}
              </div>
            )}
          </section>
        )}

        {/* Navigasyon */}
        <div className="flex justify-between mt-6 pt-4 border-t border-[#D6DCE3]">
          <Button variant="outline"
            onClick={adim === 1 ? () => navigate('/projeler') : () => setAdim(a => a - 1)}>
            {adim === 1 ? 'İptal' : '← Geri'}
          </Button>

          {adim < 4 ? (
            <Button variant="primary" onClick={() => { if (adimDogrula()) setAdim(a => a + 1) }}>
              İleri →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleKaydet} loading={createProject.isPending}>
              Projeyi oluştur
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
