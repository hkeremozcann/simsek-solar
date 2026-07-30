import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProject, useUpdateProject, useFirmalar, useKullanicilar, useBayiler } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select, Textarea, CheckboxGroup } from '@/components/ui/FormField'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  KURUM_TIPLERI, SISTEM_TIPLERI, MONTAJ_KAPSAMI_SECENEKLERI,
  TURKIYE_ILLERI, type ProjeKapsami, type SistemTipi
} from '@/lib/types'

export default function ProjeDuzenle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { rolKontrol } = useAuth()
  const { data: proje, isLoading } = useProject(id!)
  const { data: firmalar = [] } = useFirmalar()
  const { data: kullanicilar = [] } = useKullanicilar()
  const { data: bayiler = [] } = useBayiler()
  const updateProject = useUpdateProject()

  const [form, setForm] = useState({
    proje_adi: '',
    firma_id: '',
    sozlesme_no: '',
    sozlesme_tarihi: '',
    hedef_teslim_tarihi: '',
    santiye_adresi: '',
    il: '',
    ilce: '',
    satis_temsilcisi_id: '',
    bayi_id: '',
    montaj_kapsami: [] as ProjeKapsami[],
    toplam_kollektor_sayisi: 0,
    toplam_sehpa_sayisi: 0,
    toplam_pano_sayisi: 0,
    boyler_sayisi: 0,
    boyler_kapasitesi_lt: 0,
    pompa_grubu_sayisi: 0,
    sistem_tipi: '' as SistemTipi | '',
    notlar: '',
    durum: 'Çalışıyor' as string,
  })
  const [hata, setHata] = useState('')

  useEffect(() => {
    if (proje) {
      setForm({
        proje_adi: proje.proje_adi || '',
        firma_id: proje.firma_id || '',
        sozlesme_no: proje.sozlesme_no || '',
        sozlesme_tarihi: proje.sozlesme_tarihi || '',
        hedef_teslim_tarihi: proje.hedef_teslim_tarihi || '',
        santiye_adresi: proje.santiye_adresi || '',
        il: proje.il || '',
        ilce: proje.ilce || '',
        satis_temsilcisi_id: proje.satis_temsilcisi_id || '',
        bayi_id: proje.bayi_id || '',
        montaj_kapsami: (proje.montaj_kapsami || []) as ProjeKapsami[],
        toplam_kollektor_sayisi: proje.toplam_kollektor_sayisi || 0,
        toplam_sehpa_sayisi: proje.toplam_sehpa_sayisi || 0,
        toplam_pano_sayisi: proje.toplam_pano_sayisi || 0,
        boyler_sayisi: proje.boyler_sayisi || 0,
        boyler_kapasitesi_lt: proje.boyler_kapasitesi_lt || 0,
        pompa_grubu_sayisi: proje.pompa_grubu_sayisi || 0,
        sistem_tipi: (proje.sistem_tipi || '') as SistemTipi | '',
        notlar: proje.notlar || '',
        durum: proje.durum || 'Çalışıyor',
      })
    }
  }, [proje])

  if (!rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu'])) {
    return <div className="p-8 text-sm text-[#6B7785]">Bu sayfaya erişim izniniz yok.</div>
  }

  if (isLoading) {
    return <div className="p-8 text-sm text-[#6B7785]">Yükleniyor…</div>
  }

  function g<K extends keyof typeof form>(alan: K, deger: typeof form[K]) {
    setForm((f) => ({ ...f, [alan]: deger }))
  }

  async function handleKaydet() {
    if (!form.proje_adi.trim()) { setHata('Proje adı zorunludur.'); return }
    if (!form.il) { setHata('İl seçimi zorunludur.'); return }
    setHata('')
    try {
      await updateProject.mutateAsync({
        id: id!,
        data: {
          proje_adi: form.proje_adi,
          firma_id: form.firma_id || undefined,
          sozlesme_no: form.sozlesme_no || undefined,
          sozlesme_tarihi: form.sozlesme_tarihi || undefined,
          hedef_teslim_tarihi: form.hedef_teslim_tarihi || undefined,
          santiye_adresi: form.santiye_adresi,
          il: form.il,
          ilce: form.ilce || undefined,
          satis_temsilcisi_id: form.satis_temsilcisi_id || undefined,
          bayi_id: form.bayi_id || undefined,
          montaj_kapsami: form.montaj_kapsami,
          toplam_kollektor_sayisi: form.toplam_kollektor_sayisi,
          toplam_sehpa_sayisi: form.toplam_sehpa_sayisi,
          toplam_pano_sayisi: form.toplam_pano_sayisi || undefined,
          boyler_sayisi: form.boyler_sayisi || undefined,
          boyler_kapasitesi_lt: form.boyler_kapasitesi_lt || undefined,
          pompa_grubu_sayisi: form.pompa_grubu_sayisi || undefined,
          sistem_tipi: (form.sistem_tipi || undefined) as SistemTipi | undefined,
          notlar: form.notlar || undefined,
          durum: form.durum as 'Çalışıyor' | 'Beklemede' | 'Tamamlandı' | 'İptal',
        },
      })
      navigate(`/projeler/${id}`)
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Güncelleme başarısız.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik={`Proje düzenle — ${proje?.proje_kodu || ''}`}
        aciklama={proje?.proje_adi}
      />

      <div className="p-4 md:p-6 max-w-3xl space-y-5">
        {/* Temel bilgiler */}
        <Card>
          <CardHeader title="Temel bilgiler" />
          <div className="space-y-4">
            <FormField label="Proje adı" required>
              {(id) => <Input id={id} value={form.proje_adi} onChange={(e) => g('proje_adi', e.target.value)} />}
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Firma">
                {(id) => (
                  <Select id={id} value={form.firma_id} onChange={(e) => g('firma_id', e.target.value)}>
                    <option value="">— Seçin —</option>
                    {firmalar.map((f) => <option key={f.id} value={f.id}>{f.ad}</option>)}
                  </Select>
                )}
              </FormField>
              <FormField label="Durum">
                {(id) => (
                  <Select id={id} value={form.durum} onChange={(e) => g('durum', e.target.value)}>
                    <option value="Çalışıyor">Çalışıyor</option>
                    <option value="Beklemede">Beklemede</option>
                    <option value="İptal">İptal</option>
                  </Select>
                )}
              </FormField>
              <FormField label="Sözleşme numarası">
                {(id) => <Input id={id} value={form.sozlesme_no} onChange={(e) => g('sozlesme_no', e.target.value)} />}
              </FormField>
              <FormField label="Hedef teslim tarihi">
                {(id) => <Input id={id} type="date" value={form.hedef_teslim_tarihi} onChange={(e) => g('hedef_teslim_tarihi', e.target.value)} />}
              </FormField>
            </div>
          </div>
        </Card>

        {/* Saha bilgileri */}
        <Card>
          <CardHeader title="Saha bilgileri" />
          <div className="space-y-4">
            <FormField label="Şantiye adresi">
              {(id) => <Textarea id={id} value={form.santiye_adresi} onChange={(e) => g('santiye_adresi', e.target.value)} />}
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="İl" required>
                {(id) => (
                  <Select id={id} value={form.il} onChange={(e) => g('il', e.target.value)}>
                    <option value="">— Seçin —</option>
                    {TURKIYE_ILLERI.sort().map((il) => <option key={il} value={il}>{il}</option>)}
                  </Select>
                )}
              </FormField>
              <FormField label="İlçe">
                {(id) => <Input id={id} value={form.ilce} onChange={(e) => g('ilce', e.target.value)} />}
              </FormField>
            </div>
          </div>
        </Card>

        {/* Teknik bilgiler */}
        <Card>
          <CardHeader title="Teknik miktarlar" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Toplam kollektör', key: 'toplam_kollektor_sayisi' as const },
              { label: 'Toplam sehpa', key: 'toplam_sehpa_sayisi' as const },
              { label: 'Toplam pano', key: 'toplam_pano_sayisi' as const },
              { label: 'Boyler sayısı', key: 'boyler_sayisi' as const },
              { label: 'Boyler kapasitesi (lt)', key: 'boyler_kapasitesi_lt' as const },
              { label: 'Pompa grubu', key: 'pompa_grubu_sayisi' as const },
            ].map(({ label, key }) => (
              <FormField key={key} label={label}>
                {(id) => (
                  <Input id={id} type="number" min={0} value={form[key]}
                    onChange={(e) => g(key, parseInt(e.target.value) || 0)} />
                )}
              </FormField>
            ))}
            <FormField label="Sistem tipi" className="md:col-span-3">
              {(id) => (
                <Select id={id} value={form.sistem_tipi} onChange={(e) => g('sistem_tipi', e.target.value as SistemTipi)}>
                  <option value="">— Seçin —</option>
                  {SISTEM_TIPLERI.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              )}
            </FormField>
          </div>
        </Card>

        {/* Kapsam & Ekip */}
        <Card>
          <CardHeader title="Kapsam ve ekip" />
          <div className="space-y-4">
            <FormField label="Montaj kapsamı">
              {(id, describedBy) => (
                <CheckboxGroup
                  id={id}
                  options={MONTAJ_KAPSAMI_SECENEKLERI.map((k) => ({ value: k, label: k }))}
                  value={form.montaj_kapsami}
                  onChange={(v) => g('montaj_kapsami', v as ProjeKapsami[])}
                  describedBy={describedBy}
                />
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Satış temsilcisi">
                {(id) => (
                  <Select id={id} value={form.satis_temsilcisi_id} onChange={(e) => g('satis_temsilcisi_id', e.target.value)}>
                    <option value="">— Seçin —</option>
                    {kullanicilar
                      .filter((k) => ['yonetici', 'satis_sonrasi_sorumlusu', 'satis_temsilcisi'].includes(k.rol))
                      .map((k) => <option key={k.id} value={k.id}>{k.ad_soyad}</option>)}
                  </Select>
                )}
              </FormField>
              <FormField label="Bayi">
                {(id) => (
                  <Select id={id} value={form.bayi_id} onChange={(e) => g('bayi_id', e.target.value)}>
                    <option value="">— Direkt satış —</option>
                    {bayiler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
                  </Select>
                )}
              </FormField>
            </div>
            <FormField label="Notlar">
              {(id) => <Textarea id={id} value={form.notlar} onChange={(e) => g('notlar', e.target.value)} />}
            </FormField>
          </div>
        </Card>

        {hata && (
          <div className="text-sm text-[#B3261E] bg-red-50 border border-[#B3261E]/20 rounded p-3" role="alert">
            {hata}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/projeler/${id}`)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleKaydet} loading={updateProject.isPending}>
            Değişiklikleri kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}
