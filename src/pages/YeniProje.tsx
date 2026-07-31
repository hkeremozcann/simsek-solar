import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select, Textarea, CheckboxGroup } from '@/components/ui/FormField'
import { PageHeader } from '@/components/layout/PageHeader'
import { useFirmalar, useKullanicilar, useBayiler, useCreateProject } from '@/hooks/useProjects'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  KURUM_TIPLERI, SISTEM_TIPLERI, MONTAJ_KAPSAMI_SECENEKLERI,
  TURKIYE_ILLERI, type ProjeKapsami, type KurumTipi, type SistemTipi
} from '@/lib/types'

interface SantiyeYetkili {
  ad_soyad: string
  gorevi: string
  telefon: string
  eposta: string
  birincil_mi: boolean
}

interface RaporAlicisi {
  eposta: string
  ad_soyad: string
  alici_tipi: 'Kime' | 'Bilgi'
}

interface FormData {
  // Adım 1
  firma_id: string
  yeni_firma_adi: string
  yeni_firma_kurum_tipi: KurumTipi
  sozlesme_no: string
  sozlesme_tarihi: string
  hedef_teslim_tarihi: string

  // Adım 2
  santiye_adresi: string
  il: string
  ilce: string
  blok_sayisi: number
  blok_adlandirma_tipi: 'harf' | 'sayi'
  toplam_kollektor_sayisi: number
  toplam_sehpa_sayisi: number
  toplam_pano_sayisi: number
  boyler_sayisi: number
  boyler_kapasitesi_lt: number
  pompa_grubu_sayisi: number
  sistem_tipi: SistemTipi | ''

  // Adım 3
  satis_temsilcisi_id: string
  bayi_id: string
  santiye_yetkilileri: SantiyeYetkili[]
  rapor_alicilari: RaporAlicisi[]

  // Adım 4
  montaj_kapsami: ProjeKapsami[]
  proje_adi: string
  notlar: string
}

const BOSH_FORM: FormData = {
  firma_id: '', yeni_firma_adi: '', yeni_firma_kurum_tipi: 'TOKİ',
  sozlesme_no: '', sozlesme_tarihi: '', hedef_teslim_tarihi: '',
  santiye_adresi: '', il: '', ilce: '',
  blok_sayisi: 1, blok_adlandirma_tipi: 'harf',
  toplam_kollektor_sayisi: 0, toplam_sehpa_sayisi: 0, toplam_pano_sayisi: 0,
  boyler_sayisi: 0, boyler_kapasitesi_lt: 0, pompa_grubu_sayisi: 0, sistem_tipi: '',
  satis_temsilcisi_id: '', bayi_id: '',
  santiye_yetkilileri: [{ ad_soyad: '', gorevi: 'Şantiye Şefi', telefon: '', eposta: '', birincil_mi: true }],
  rapor_alicilari: [{ eposta: '', ad_soyad: '', alici_tipi: 'Kime' }],
  montaj_kapsami: [], proje_adi: '', notlar: '',
}

const ADIMLAR = ['Firma & Sözleşme', 'Saha & Teknik', 'Kişiler', 'Kapsam & Özet']

export default function YeniProje() {
  const navigate = useNavigate()
  const { kullanici } = useAuth()
  const [adim, setAdim] = useState(1)
  const [form, setForm] = useState<FormData>(BOSH_FORM)
  const [hatalar, setHatalar] = useState<Record<string, string>>({})

  const { data: firmalar = [] } = useFirmalar()
  const { data: kullanicilarRaw = [] } = useKullanicilar()
  const { data: bayiler = [] } = useBayiler()
  const createProject = useCreateProject()

  // Mevcut kullanıcıyı her zaman listeye ekle (DB boş olsa bile)
  const kullanicilar = useMemo(() => {
    const liste = kullanicilarRaw.filter(k =>
      ['yonetici', 'satis_sonrasi_sorumlusu', 'satis_temsilcisi'].includes(k.rol)
    )
    if (kullanici && !liste.find(k => k.id === kullanici.id)) {
      return [kullanici, ...liste]
    }
    return liste.length > 0 ? liste : kullanici ? [kullanici] : []
  }, [kullanicilarRaw, kullanici])

  // Mevcut kullanıcıyı otomatik satış temsilcisi olarak seç
  useEffect(() => {
    if (kullanici && !form.satis_temsilcisi_id) {
      guncelle('satis_temsilcisi_id', kullanici.id)
    }
  }, [kullanici, kullanicilar])

  function guncelle<K extends keyof FormData>(alan: K, deger: FormData[K]) {
    setForm((prev) => ({ ...prev, [alan]: deger }))
    setHatalar((prev) => { const h = { ...prev }; delete h[alan]; return h })
  }

  function adimDogrula(): boolean {
    const yeniHatalar: Record<string, string> = {}

    if (adim === 1) {
      if (!form.firma_id && !form.yeni_firma_adi) yeniHatalar.firma = 'Firma seçin veya yeni firma adı girin.'
      if (!form.proje_adi) yeniHatalar.proje_adi = 'Proje adı zorunludur.'
    }
    if (adim === 2) {
      if (!form.santiye_adresi) yeniHatalar.santiye_adresi = 'Şantiye adresi zorunludur.'
      if (!form.il) yeniHatalar.il = 'İl seçimi zorunludur.'
      if (form.blok_sayisi < 1) yeniHatalar.blok_sayisi = 'En az 1 blok olmalıdır.'
      if (form.toplam_kollektor_sayisi < 1) yeniHatalar.toplam_kollektor_sayisi = 'Toplam kollektör sayısı girilmelidir.'
    }
    if (adim === 3) {
      if (!form.satis_temsilcisi_id) yeniHatalar.satis_temsilcisi_id = 'Satış temsilcisi seçilmelidir.'
    }
    if (adim === 4) {
      if (form.montaj_kapsami.length === 0) yeniHatalar.montaj_kapsami = 'En az bir kapsam seçilmelidir.'
    }

    setHatalar(yeniHatalar)
    return Object.keys(yeniHatalar).length === 0
  }

  function ileriGit() {
    if (adimDogrula()) setAdim((a) => Math.min(4, a + 1))
  }

  function geriGit() {
    setAdim((a) => Math.max(1, a - 1))
  }

  async function handleKaydet() {
    if (!adimDogrula()) return

    try {
      // "yeni" seçilmişse önce firmayı oluştur
      let firmaId = form.firma_id
      if (form.firma_id === 'yeni') {
        if (!form.yeni_firma_adi.trim()) {
          setHatalar({ firma: 'Yeni firma adı zorunludur.' })
          return
        }
        const { data: yeniFirma, error: firmaErr } = await supabase
          .from('firmalar')
          .insert({ ad: form.yeni_firma_adi, kurum_tipi: form.yeni_firma_kurum_tipi, aktif_mi: true, silindi_mi: false })
          .select('id').single()
        if (firmaErr) throw firmaErr
        firmaId = yeniFirma.id
      }

      const projeData = {
        proje_adi: form.proje_adi,
        firma_id: firmaId,
        sozlesme_no: form.sozlesme_no || undefined,
        sozlesme_tarihi: form.sozlesme_tarihi || undefined,
        hedef_teslim_tarihi: form.hedef_teslim_tarihi || undefined,
        santiye_adresi: form.santiye_adresi,
        il: form.il,
        ilce: form.ilce || undefined,
        satis_temsilcisi_id: form.satis_temsilcisi_id,
        bayi_id: form.bayi_id || undefined,
        montaj_kapsami: form.montaj_kapsami,
        blok_sayisi: form.blok_sayisi,
        toplam_kollektor_sayisi: form.toplam_kollektor_sayisi,
        toplam_sehpa_sayisi: form.toplam_sehpa_sayisi,
        toplam_pano_sayisi: form.toplam_pano_sayisi || undefined,
        boyler_sayisi: form.boyler_sayisi || undefined,
        boyler_kapasitesi_lt: form.boyler_kapasitesi_lt || undefined,
        pompa_grubu_sayisi: form.pompa_grubu_sayisi || undefined,
        sistem_tipi: form.sistem_tipi || undefined,
        notlar: form.notlar || undefined,
      }

      const result = await createProject.mutateAsync({
        proje: projeData as Parameters<typeof createProject.mutateAsync>[0]['proje'],
        blokAdlandirmaTipi: form.blok_adlandirma_tipi,
        santiyeYetkilileri: form.santiye_yetkilileri.filter((sy) => sy.ad_soyad),
        raporAlicilari: form.rapor_alicilari.filter((ra) => ra.eposta),
      })

      navigate(`/projeler/${result.id}`)
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : null) ||
        (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : null) ||
        JSON.stringify(err)
      console.error('Proje oluşturma hatası:', err)
      setHatalar({ genel: msg })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Yeni proje ekle"
        aciklama="Proje bilgilerini adım adım doldurun."
      />

      {/* İlerleme göstergesi */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-3">
        <nav aria-label="Proje oluşturma adımları">
          <ol className="flex gap-2 md:gap-6">
            {ADIMLAR.map((label, i) => {
              const no = i + 1
              const tamamlandi = no < adim
              const aktif = no === adim
              return (
                <li key={label} className="flex items-center gap-2">
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      tamamlandi
                        ? 'bg-[#1B7A4B] border-[#1B7A4B] text-white'
                        : aktif
                        ? 'border-[#B4531F] text-[#B4531F]'
                        : 'border-[#D6DCE3] text-[#6B7785]'
                    }`}
                    aria-current={aktif ? 'step' : undefined}
                  >
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
        </nav>
      </div>

      <div className="p-4 md:p-6 max-w-2xl">
        {/* Adım 1: Firma & Sözleşme */}
        {adim === 1 && (
          <section aria-labelledby="adim1-baslik" className="space-y-4">
            <h2 id="adim1-baslik" className="text-lg font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Firma ve sözleşme bilgileri
            </h2>

            <FormField label="Proje adı" required error={hatalar.proje_adi}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  value={form.proje_adi}
                  onChange={(e) => guncelle('proje_adi', e.target.value)}
                  placeholder="örn. TOKİ Gaziantep 3. Etap — Güneş Enerjisi"
                  aria-describedby={describedBy}
                  error={!!hatalar.proje_adi}
                />
              )}
            </FormField>

            <FormField label="Firma" required error={hatalar.firma}>
              {(id, describedBy) => (
                <Select
                  id={id}
                  value={form.firma_id}
                  onChange={(e) => guncelle('firma_id', e.target.value)}
                  aria-describedby={describedBy}
                  error={!!hatalar.firma}
                >
                  <option value="">— Firma seçin —</option>
                  {firmalar.map((f) => (
                    <option key={f.id} value={f.id}>{f.ad}</option>
                  ))}
                  <option value="yeni">+ Yeni firma ekle</option>
                </Select>
              )}
            </FormField>

            {form.firma_id === 'yeni' && (
              <div className="border border-[#D6DCE3] rounded p-4 space-y-3 bg-[#F5F7F9]">
                <p className="text-sm font-medium text-[#0F1F33]">Yeni firma bilgileri</p>
                <FormField label="Firma adı" required>
                  {(id) => (
                    <Input id={id} value={form.yeni_firma_adi}
                      onChange={(e) => guncelle('yeni_firma_adi', e.target.value)}
                      placeholder="örn. TOKİ Gaziantep 3. Etap" />
                  )}
                </FormField>
                <FormField label="Kurum tipi" required>
                  {(id) => (
                    <Select id={id} value={form.yeni_firma_kurum_tipi}
                      onChange={(e) => guncelle('yeni_firma_kurum_tipi', e.target.value as KurumTipi)}>
                      {KURUM_TIPLERI.map((k) => <option key={k} value={k}>{k}</option>)}
                    </Select>
                  )}
                </FormField>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Sözleşme numarası">
                {(id) => (
                  <Input id={id} value={form.sozlesme_no}
                    onChange={(e) => guncelle('sozlesme_no', e.target.value)} />
                )}
              </FormField>
              <FormField label="Sözleşme tarihi">
                {(id) => (
                  <Input id={id} type="date" value={form.sozlesme_tarihi}
                    onChange={(e) => guncelle('sozlesme_tarihi', e.target.value)} />
                )}
              </FormField>
            </div>

            <FormField label="Hedef teslim tarihi">
              {(id) => (
                <Input id={id} type="date" value={form.hedef_teslim_tarihi}
                  onChange={(e) => guncelle('hedef_teslim_tarihi', e.target.value)} />
              )}
            </FormField>
          </section>
        )}

        {/* Adım 2: Saha & Teknik */}
        {adim === 2 && (
          <section aria-labelledby="adim2-baslik" className="space-y-4">
            <h2 id="adim2-baslik" className="text-lg font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Saha ve teknik bilgiler
            </h2>

            <FormField label="Şantiye adresi" required error={hatalar.santiye_adresi}>
              {(id, describedBy) => (
                <Textarea id={id} value={form.santiye_adresi}
                  onChange={(e) => guncelle('santiye_adresi', e.target.value)}
                  aria-describedby={describedBy} error={!!hatalar.santiye_adresi}
                  placeholder="Tam şantiye adresi" />
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="İl" required error={hatalar.il}>
                {(id, describedBy) => (
                  <Select id={id} value={form.il}
                    onChange={(e) => guncelle('il', e.target.value)}
                    aria-describedby={describedBy} error={!!hatalar.il}>
                    <option value="">— İl seçin —</option>
                    {TURKIYE_ILLERI.sort().map((il) => (
                      <option key={il} value={il}>{il}</option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="İlçe">
                {(id) => (
                  <Input id={id} value={form.ilce}
                    onChange={(e) => guncelle('ilce', e.target.value)} />
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Blok sayısı" required error={hatalar.blok_sayisi}>
                {(id, describedBy) => (
                  <Input id={id} type="number" min={1} value={form.blok_sayisi}
                    onChange={(e) => guncelle('blok_sayisi', parseInt(e.target.value) || 1)}
                    aria-describedby={describedBy} error={!!hatalar.blok_sayisi} />
                )}
              </FormField>
              <FormField label="Blok adlandırma" hint="A Blok, B Blok... veya 1. Blok, 2. Blok...">
                {(id, describedBy) => (
                  <Select id={id} value={form.blok_adlandirma_tipi}
                    onChange={(e) => guncelle('blok_adlandirma_tipi', e.target.value as 'harf' | 'sayi')}
                    aria-describedby={describedBy}>
                    <option value="harf">Harfli (A Blok, B Blok…)</option>
                    <option value="sayi">Sayılı (1. Blok, 2. Blok…)</option>
                  </Select>
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Toplam kollektör" required error={hatalar.toplam_kollektor_sayisi}>
                {(id, describedBy) => (
                  <Input id={id} type="number" min={0} value={form.toplam_kollektor_sayisi}
                    onChange={(e) => guncelle('toplam_kollektor_sayisi', parseInt(e.target.value) || 0)}
                    aria-describedby={describedBy} error={!!hatalar.toplam_kollektor_sayisi} />
                )}
              </FormField>
              <FormField label="Toplam sehpa" required>
                {(id) => (
                  <Input id={id} type="number" min={0} value={form.toplam_sehpa_sayisi}
                    onChange={(e) => guncelle('toplam_sehpa_sayisi', parseInt(e.target.value) || 0)} />
                )}
              </FormField>
              <FormField label="Toplam pano">
                {(id) => (
                  <Input id={id} type="number" min={0} value={form.toplam_pano_sayisi}
                    onChange={(e) => guncelle('toplam_pano_sayisi', parseInt(e.target.value) || 0)} />
                )}
              </FormField>
              <FormField label="Boyler sayısı">
                {(id) => (
                  <Input id={id} type="number" min={0} value={form.boyler_sayisi}
                    onChange={(e) => guncelle('boyler_sayisi', parseInt(e.target.value) || 0)} />
                )}
              </FormField>
              <FormField label="Boyler kapasitesi (lt)">
                {(id) => (
                  <Input id={id} type="number" min={0} value={form.boyler_kapasitesi_lt}
                    onChange={(e) => guncelle('boyler_kapasitesi_lt', parseInt(e.target.value) || 0)} />
                )}
              </FormField>
              <FormField label="Pompa grubu">
                {(id) => (
                  <Input id={id} type="number" min={0} value={form.pompa_grubu_sayisi}
                    onChange={(e) => guncelle('pompa_grubu_sayisi', parseInt(e.target.value) || 0)} />
                )}
              </FormField>
            </div>

            <FormField label="Sistem tipi">
              {(id) => (
                <Select id={id} value={form.sistem_tipi}
                  onChange={(e) => guncelle('sistem_tipi', e.target.value as SistemTipi)}>
                  <option value="">— Seçin —</option>
                  {SISTEM_TIPLERI.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              )}
            </FormField>
          </section>
        )}

        {/* Adım 3: Kişiler */}
        {adim === 3 && (
          <section aria-labelledby="adim3-baslik" className="space-y-5">
            <h2 id="adim3-baslik" className="text-lg font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Kişiler ve iletişim
            </h2>

            <FormField label="Satış temsilcisi" required error={hatalar.satis_temsilcisi_id}>
              {(id, describedBy) => (
                <Select id={id} value={form.satis_temsilcisi_id}
                  onChange={(e) => guncelle('satis_temsilcisi_id', e.target.value)}
                  aria-describedby={describedBy} error={!!hatalar.satis_temsilcisi_id}>
                  <option value="">— Seçin —</option>
                  {kullanicilar.map((k) => (
                    <option key={k.id} value={k.id}>{k.ad_soyad}</option>
                  ))}
                </Select>
              )}
            </FormField>

            <FormField label="Bayi" hint="Direkt satışta boş bırakın.">
              {(id, describedBy) => (
                <Select id={id} value={form.bayi_id}
                  onChange={(e) => guncelle('bayi_id', e.target.value)}
                  aria-describedby={describedBy}>
                  <option value="">— Direkt satış —</option>
                  {bayiler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
                </Select>
              )}
            </FormField>

            {/* Şantiye yetkilileri */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#0F1F33]">Şantiye yetkilileri</span>
                <button
                  type="button"
                  onClick={() => guncelle('santiye_yetkilileri', [
                    ...form.santiye_yetkilileri,
                    { ad_soyad: '', gorevi: 'Şantiye Şefi', telefon: '', eposta: '', birincil_mi: false }
                  ])}
                  className="text-sm text-[#1B4B73] hover:underline min-h-[36px] px-2"
                >
                  + Kişi ekle
                </button>
              </div>
              <div className="space-y-3">
                {form.santiye_yetkilileri.map((sy, i) => (
                  <div key={i} className="border border-[#D6DCE3] rounded p-3 space-y-2 bg-[#F5F7F9]">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Ad soyad">
                        {(id) => (
                          <Input id={id} value={sy.ad_soyad}
                            onChange={(e) => {
                              const list = [...form.santiye_yetkilileri]
                              list[i] = { ...sy, ad_soyad: e.target.value }
                              guncelle('santiye_yetkilileri', list)
                            }} />
                        )}
                      </FormField>
                      <FormField label="Görevi">
                        {(id) => (
                          <Select id={id} value={sy.gorevi}
                            onChange={(e) => {
                              const list = [...form.santiye_yetkilileri]
                              list[i] = { ...sy, gorevi: e.target.value }
                              guncelle('santiye_yetkilileri', list)
                            }}>
                            <option>Şantiye Şefi</option>
                            <option>Kontrol Amiri</option>
                            <option>Teknik Ofis</option>
                            <option>Taşeron Yetkilisi</option>
                          </Select>
                        )}
                      </FormField>
                      <FormField label="Telefon">
                        {(id) => (
                          <Input id={id} type="tel" value={sy.telefon}
                            onChange={(e) => {
                              const list = [...form.santiye_yetkilileri]
                              list[i] = { ...sy, telefon: e.target.value }
                              guncelle('santiye_yetkilileri', list)
                            }} />
                        )}
                      </FormField>
                      <FormField label="E-posta">
                        {(id) => (
                          <Input id={id} type="email" value={sy.eposta}
                            onChange={(e) => {
                              const list = [...form.santiye_yetkilileri]
                              list[i] = { ...sy, eposta: e.target.value }
                              guncelle('santiye_yetkilileri', list)
                            }} />
                        )}
                      </FormField>
                    </div>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const list = form.santiye_yetkilileri.filter((_, j) => j !== i)
                          guncelle('santiye_yetkilileri', list)
                        }}
                        className="text-xs text-[#B3261E] hover:underline"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rapor alıcıları */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-[#0F1F33]">Saha raporu e-posta listesi</span>
                  <p className="text-xs text-[#6B7785]">Saha raporları bu adreslere gönderilecek.</p>
                </div>
                <button
                  type="button"
                  onClick={() => guncelle('rapor_alicilari', [
                    ...form.rapor_alicilari,
                    { eposta: '', ad_soyad: '', alici_tipi: 'Bilgi' as const }
                  ])}
                  className="text-sm text-[#1B4B73] hover:underline min-h-[36px] px-2"
                >
                  + Ekle
                </button>
              </div>
              <div className="space-y-2">
                {form.rapor_alicilari.map((ra, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <FormField label="E-posta">
                        {(id) => (
                          <Input id={id} type="email" value={ra.eposta}
                            onChange={(e) => {
                              const list = [...form.rapor_alicilari]
                              list[i] = { ...ra, eposta: e.target.value }
                              guncelle('rapor_alicilari', list)
                            }} />
                        )}
                      </FormField>
                      <FormField label="Ad soyad">
                        {(id) => (
                          <Input id={id} value={ra.ad_soyad}
                            onChange={(e) => {
                              const list = [...form.rapor_alicilari]
                              list[i] = { ...ra, ad_soyad: e.target.value }
                              guncelle('rapor_alicilari', list)
                            }} />
                        )}
                      </FormField>
                      <FormField label="Tür">
                        {(id) => (
                          <Select id={id} value={ra.alici_tipi}
                            onChange={(e) => {
                              const list = [...form.rapor_alicilari]
                              list[i] = { ...ra, alici_tipi: e.target.value as 'Kime' | 'Bilgi' }
                              guncelle('rapor_alicilari', list)
                            }}>
                            <option value="Kime">Kime (To)</option>
                            <option value="Bilgi">Bilgi (CC)</option>
                          </Select>
                        )}
                      </FormField>
                    </div>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const list = form.rapor_alicilari.filter((_, j) => j !== i)
                          guncelle('rapor_alicilari', list)
                        }}
                        className="text-[#B3261E] mt-6 hover:opacity-75"
                        aria-label="Alıcıyı kaldır"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Adım 4: Kapsam & Özet */}
        {adim === 4 && (
          <section aria-labelledby="adim4-baslik" className="space-y-5">
            <h2 id="adim4-baslik" className="text-lg font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo' }}>
              Kapsam ve özet
            </h2>

            <FormField label="Montaj kapsamı" required error={hatalar.montaj_kapsami}
              hint="Projenin hangi bileşenlerini kapsıyor?">
              {(id, describedBy) => (
                <CheckboxGroup
                  id={id}
                  options={MONTAJ_KAPSAMI_SECENEKLERI.map((k) => ({ value: k, label: k }))}
                  value={form.montaj_kapsami}
                  onChange={(v) => guncelle('montaj_kapsami', v as ProjeKapsami[])}
                  describedBy={describedBy}
                />
              )}
            </FormField>

            <FormField label="Notlar">
              {(id) => (
                <Textarea id={id} value={form.notlar}
                  onChange={(e) => guncelle('notlar', e.target.value)}
                  placeholder="Projeyle ilgili ek notlar..." />
              )}
            </FormField>

            {/* Özet önizleme */}
            <div className="bg-[#F5F7F9] border border-[#D6DCE3] rounded p-4 space-y-2">
              <p className="text-sm font-semibold text-[#0F1F33] mb-3">Özet</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-[#6B7785]">Proje adı:</span>
                <span className="font-medium">{form.proje_adi}</span>
                <span className="text-[#6B7785]">Şantiye:</span>
                <span>{form.il}{form.ilce ? `, ${form.ilce}` : ''}</span>
                <span className="text-[#6B7785]">Blok sayısı:</span>
                <span className="font-mono">{form.blok_sayisi}</span>
                <span className="text-[#6B7785]">Toplam kollektör:</span>
                <span className="font-mono">{form.toplam_kollektor_sayisi}</span>
                <span className="text-[#6B7785]">Oluşturulacak aşama:</span>
                <span className="font-mono">{form.blok_sayisi * 5} kayıt</span>
              </div>
            </div>

            {hatalar.genel && (
              <div className="text-sm text-[#B3261E] bg-red-50 border border-[#B3261E]/20 rounded p-3" role="alert">
                {hatalar.genel}
              </div>
            )}
          </section>
        )}

        {/* Navigasyon butonları */}
        <div className="flex justify-between mt-6 pt-4 border-t border-[#D6DCE3]">
          <Button
            variant="outline"
            onClick={adim === 1 ? () => navigate('/projeler') : geriGit}
          >
            {adim === 1 ? 'İptal' : '← Geri'}
          </Button>

          {adim < 4 ? (
            <Button variant="primary" onClick={ileriGit}>
              İleri →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleKaydet}
              loading={createProject.isPending}
            >
              Projeyi oluştur
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
