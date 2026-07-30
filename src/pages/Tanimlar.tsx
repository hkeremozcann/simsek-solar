import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFirmalar, useKullanicilar, useBayiler } from '@/hooks/useProjects'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { FormField, Input, Select } from '@/components/ui/FormField'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { ROL_ETIKETLERI, KURUM_TIPLERI, type KullaniciRolu, type KurumTipi } from '@/lib/types'
import { cn } from '@/lib/utils'

type TanimSekme = 'firmalar' | 'kullanicilar' | 'bayiler'

export default function Tanimlar() {
  const { rolKontrol } = useAuth()
  const [aktifSekme, setAktifSekme] = useState<TanimSekme>('firmalar')

  if (!rolKontrol(['yonetici'])) {
    return (
      <div className="p-8">
        <EmptyState
          baslik="Erişim izniniz yok"
          aciklama="Bu sayfa yalnızca yöneticiler tarafından görüntülenebilir."
        />
      </div>
    )
  }

  const SEKMELER: { id: TanimSekme; label: string }[] = [
    { id: 'firmalar', label: 'Firmalar' },
    { id: 'kullanicilar', label: 'Kullanıcılar' },
    { id: 'bayiler', label: 'Bayiler' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader baslik="Tanımlar" aciklama="Firmalar, kullanıcılar ve bayiler" />

      <div className="border-b border-[#D6DCE3] bg-white">
        <nav aria-label="Tanım sekmeleri" className="px-4 md:px-6">
          <ul className="flex gap-0" role="tablist">
            {SEKMELER.map((sekme) => (
              <li key={sekme.id}>
                <button
                  role="tab"
                  aria-selected={aktifSekme === sekme.id}
                  onClick={() => setAktifSekme(sekme.id)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px]',
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
      </div>

      <div className="p-4 md:p-6">
        {aktifSekme === 'firmalar' && <FirmalarTablosu />}
        {aktifSekme === 'kullanicilar' && <KullanicilarTablosu />}
        {aktifSekme === 'bayiler' && <BayilerTablosu />}
      </div>
    </div>
  )
}

// ─── Firmalar ─────────────────────────────────────────────────
function FirmalarTablosu() {
  const { data: firmalar = [], isLoading } = useFirmalar()
  const queryClient = useQueryClient()
  const bos = { ad: '', kurum_tipi: 'TOKİ' as KurumTipi, ana_yuklenici: '', il: '', ilce: '', telefon: '', genel_eposta: '', vergi_dairesi: '', vergi_no: '', adres: '' }
  const [modalAcik, setModalAcik] = useState(false)
  const [form, setForm] = useState(bos)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  function g<K extends keyof typeof bos>(alan: K, deger: typeof bos[K]) {
    setForm((f) => ({ ...f, [alan]: deger }))
  }

  async function handleKaydet() {
    if (!form.ad.trim()) { setHata('Firma adı zorunludur.'); return }
    setYukleniyor(true); setHata('')
    const { error } = await supabase.from('firmalar').insert({
      ad: form.ad,
      kurum_tipi: form.kurum_tipi,
      ana_yuklenici: form.ana_yuklenici || null,
      il: form.il || null,
      ilce: form.ilce || null,
      telefon: form.telefon || null,
      genel_eposta: form.genel_eposta || null,
      vergi_dairesi: form.vergi_dairesi || null,
      vergi_no: form.vergi_no || null,
      adres: form.adres || null,
    })
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['firmalar'] })
    setModalAcik(false)
    setForm(bos)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#6B7785]">{firmalar.length} firma kayıtlı</p>
        <Button variant="primary" size="sm" onClick={() => { setModalAcik(true); setHata('') }}>
          + Firma ekle
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#6B7785] py-8 text-center">Yükleniyor…</p>
      ) : (
        <Card padding="none">
          <div className="table-scroll">
            <table className="w-full" aria-label="Firmalar listesi">
              <thead>
                <tr className="border-b border-[#D6DCE3]">
                  {['Firma Adı', 'Kurum Tipi', 'Ana Yüklenici', 'İl', 'Telefon', 'E-posta'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firmalar.map((f) => (
                  <tr key={f.id} className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] text-sm">
                    <td className="px-4 py-3 font-medium text-[#0F1F33]">{f.ad}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{f.kurum_tipi}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#6B7785]">{f.ana_yuklenici || '—'}</td>
                    <td className="px-4 py-3 text-[#6B7785]">{f.il || '—'}</td>
                    <td className="px-4 py-3 text-[#6B7785]">
                      {f.telefon ? <a href={`tel:${f.telefon}`} className="hover:underline">{f.telefon}</a> : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B7785]">
                      {f.genel_eposta ? <a href={`mailto:${f.genel_eposta}`} className="hover:underline">{f.genel_eposta}</a> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {firmalar.length === 0 && <EmptyState baslik="Henüz firma eklenmemiş" aciklama="Sağ üstteki butona tıklayarak ilk firmayı ekleyin." />}
        </Card>
      )}

      <Modal acik={modalAcik} kapat={() => setModalAcik(false)} baslik="Yeni firma ekle" genislik="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Firma adı" required>
              {(id) => <Input id={id} value={form.ad} onChange={(e) => g('ad', e.target.value)} placeholder="örn. TOKİ Gaziantep 3. Etap" error={!!hata && !form.ad} />}
            </FormField>
            <FormField label="Kurum tipi" required>
              {(id) => (
                <Select id={id} value={form.kurum_tipi} onChange={(e) => g('kurum_tipi', e.target.value as KurumTipi)}>
                  {KURUM_TIPLERI.map((k) => <option key={k} value={k}>{k}</option>)}
                </Select>
              )}
            </FormField>
            <FormField label="Ana yüklenici">
              {(id) => <Input id={id} value={form.ana_yuklenici} onChange={(e) => g('ana_yuklenici', e.target.value)} placeholder="İnşaat firması" />}
            </FormField>
            <FormField label="Vergi dairesi">
              {(id) => <Input id={id} value={form.vergi_dairesi} onChange={(e) => g('vergi_dairesi', e.target.value)} />}
            </FormField>
            <FormField label="Vergi numarası">
              {(id) => <Input id={id} value={form.vergi_no} onChange={(e) => g('vergi_no', e.target.value)} />}
            </FormField>
            <FormField label="İl">
              {(id) => <Input id={id} value={form.il} onChange={(e) => g('il', e.target.value)} />}
            </FormField>
            <FormField label="İlçe">
              {(id) => <Input id={id} value={form.ilce} onChange={(e) => g('ilce', e.target.value)} />}
            </FormField>
            <FormField label="Telefon">
              {(id) => <Input id={id} type="tel" value={form.telefon} onChange={(e) => g('telefon', e.target.value)} />}
            </FormField>
            <FormField label="Genel e-posta">
              {(id) => <Input id={id} type="email" value={form.genel_eposta} onChange={(e) => g('genel_eposta', e.target.value)} />}
            </FormField>
            <FormField label="Adres" className="md:col-span-2">
              {(id) => <Input id={id} value={form.adres} onChange={(e) => g('adres', e.target.value)} />}
            </FormField>
          </div>
          {hata && <p className="text-sm text-[#B3261E] bg-red-50 p-2 rounded" role="alert">{hata}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalAcik(false)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={handleKaydet} loading={yukleniyor} className="flex-1">Firmayı kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Kullanıcılar ─────────────────────────────────────────────
function KullanicilarTablosu() {
  const { data: kullanicilar = [], isLoading } = useKullanicilar()
  const queryClient = useQueryClient()
  const { kullaniciyiYenile } = useAuth()
  const [duzenleModal, setDuzenleModal] = useState(false)
  const [secilen, setSecilen] = useState<typeof kullanicilar[0] | null>(null)
  const [form, setForm] = useState({ ad_soyad: '', rol: 'satis_temsilcisi' as KullaniciRolu, telefon: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  function duzenleAc(k: typeof kullanicilar[0]) {
    setSecilen(k)
    setForm({ ad_soyad: k.ad_soyad, rol: k.rol as KullaniciRolu, telefon: k.telefon || '' })
    setHata('')
    setDuzenleModal(true)
  }

  async function handleKaydet() {
    if (!secilen) return
    if (!form.ad_soyad.trim()) { setHata('Ad soyad zorunludur.'); return }
    setYukleniyor(true); setHata('')
    const { error } = await supabase
      .from('kullanicilar')
      .update({ ad_soyad: form.ad_soyad, rol: form.rol, telefon: form.telefon || null })
      .eq('id', secilen.id)
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['kullanicilar'] })
    await kullaniciyiYenile()
    setDuzenleModal(false)
  }

  return (
    <div>
      <div className="mb-4 bg-[#1B4B73]/5 border border-[#1B4B73]/20 rounded p-4">
        <p className="text-sm font-medium text-[#1B4B73] mb-1">Yeni kullanıcı nasıl eklenir?</p>
        <ol className="text-sm text-[#6B7785] space-y-1 list-decimal list-inside">
          <li>Supabase Dashboard → <strong>Authentication → Users → Add user</strong></li>
          <li>E-posta ve şifre girin, kaydedin</li>
          <li>Sistem otomatik olarak bu tabloya "Satış Temsilcisi" rolüyle ekler</li>
          <li>Aşağıdan <strong>Düzenle</strong> ile rolünü ve adını güncelleyin</li>
        </ol>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#6B7785]">{kullanicilar.length} kullanıcı</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#6B7785] py-8 text-center">Yükleniyor…</p>
      ) : (
        <Card padding="none">
          <div className="table-scroll">
            <table className="w-full" aria-label="Kullanıcılar listesi">
              <thead>
                <tr className="border-b border-[#D6DCE3]">
                  {['Ad Soyad', 'E-posta', 'Telefon', 'Rol', 'Durum', ''].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kullanicilar.map((k) => (
                  <tr key={k.id} className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] text-sm">
                    <td className="px-4 py-3 font-medium text-[#0F1F33]">{k.ad_soyad}</td>
                    <td className="px-4 py-3 text-[#6B7785]">{k.eposta}</td>
                    <td className="px-4 py-3 text-[#6B7785]">{k.telefon || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={k.rol === 'yonetici' ? 'info' : k.rol === 'saha_teknisyeni' ? 'warning' : 'neutral'}>
                        {ROL_ETIKETLERI[k.rol as KullaniciRolu]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={k.aktif_mi ? 'success' : 'neutral'}>
                        {k.aktif_mi ? '● Aktif' : '○ Pasif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => duzenleAc(k)}>
                        Düzenle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {kullanicilar.length === 0 && (
            <EmptyState
              baslik="Kullanıcı bulunamadı"
              aciklama="Supabase Dashboard → Authentication → Users → Add user ile kullanıcı oluşturun."
            />
          )}
        </Card>
      )}

      <Modal acik={duzenleModal} kapat={() => setDuzenleModal(false)} baslik="Kullanıcıyı düzenle">
        <div className="space-y-4">
          <div className="text-xs text-[#6B7785] bg-[#F5F7F9] rounded p-2">
            E-posta: <strong>{secilen?.eposta}</strong>
          </div>
          <FormField label="Ad soyad" required>
            {(id) => (
              <Input id={id} value={form.ad_soyad}
                onChange={(e) => setForm((f) => ({ ...f, ad_soyad: e.target.value }))}
                error={!!hata && !form.ad_soyad} />
            )}
          </FormField>
          <FormField label="Telefon">
            {(id) => (
              <Input id={id} type="tel" value={form.telefon}
                onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))} />
            )}
          </FormField>
          <FormField label="Rol" required>
            {(id) => (
              <Select id={id} value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as KullaniciRolu }))}>
                {Object.entries(ROL_ETIKETLERI).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </Select>
            )}
          </FormField>
          <div className="text-xs text-[#9A6700] bg-amber-50 p-2 rounded">
            ⚠ Rol değişikliği, kullanıcının bir sonraki işleminde geçerli olur.
          </div>
          {hata && <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDuzenleModal(false)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={handleKaydet} loading={yukleniyor} className="flex-1">Kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Bayiler ──────────────────────────────────────────────────
function BayilerTablosu() {
  const { data: bayiler = [], isLoading } = useBayiler()
  const queryClient = useQueryClient()
  const bos = { ad: '', yetkili_kisi: '', telefon: '', eposta: '', il: '' }
  const [modalAcik, setModalAcik] = useState(false)
  const [form, setForm] = useState(bos)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function handleKaydet() {
    if (!form.ad.trim()) { setHata('Bayi adı zorunludur.'); return }
    setYukleniyor(true); setHata('')
    const { error } = await supabase.from('bayiler').insert({
      ad: form.ad,
      yetkili_kisi: form.yetkili_kisi || null,
      telefon: form.telefon || null,
      eposta: form.eposta || null,
      il: form.il || null,
      aktif_mi: true,
    })
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['bayiler'] })
    setModalAcik(false)
    setForm(bos)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#6B7785]">{bayiler.length} bayi kayıtlı</p>
        <Button variant="primary" size="sm" onClick={() => { setModalAcik(true); setHata('') }}>
          + Bayi ekle
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#6B7785] py-8 text-center">Yükleniyor…</p>
      ) : (
        <Card padding="none">
          <div className="table-scroll">
            <table className="w-full" aria-label="Bayiler listesi">
              <thead>
                <tr className="border-b border-[#D6DCE3]">
                  {['Bayi Adı', 'Yetkili Kişi', 'İl', 'Telefon', 'E-posta'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bayiler.map((b) => (
                  <tr key={b.id} className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] text-sm">
                    <td className="px-4 py-3 font-medium text-[#0F1F33]">{b.ad}</td>
                    <td className="px-4 py-3 text-[#6B7785]">{b.yetkili_kisi || '—'}</td>
                    <td className="px-4 py-3 text-[#6B7785]">{b.il || '—'}</td>
                    <td className="px-4 py-3 text-[#6B7785]">
                      {b.telefon ? <a href={`tel:${b.telefon}`} className="hover:underline">{b.telefon}</a> : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B7785]">
                      {b.eposta ? <a href={`mailto:${b.eposta}`} className="hover:underline">{b.eposta}</a> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bayiler.length === 0 && <EmptyState baslik="Henüz bayi eklenmemiş" />}
        </Card>
      )}

      <Modal acik={modalAcik} kapat={() => setModalAcik(false)} baslik="Yeni bayi ekle">
        <div className="space-y-4">
          <FormField label="Bayi adı" required>
            {(id) => <Input id={id} value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} error={!!hata && !form.ad} />}
          </FormField>
          <FormField label="Yetkili kişi">
            {(id) => <Input id={id} value={form.yetkili_kisi} onChange={(e) => setForm((f) => ({ ...f, yetkili_kisi: e.target.value }))} />}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="İl">
              {(id) => <Input id={id} value={form.il} onChange={(e) => setForm((f) => ({ ...f, il: e.target.value }))} />}
            </FormField>
            <FormField label="Telefon">
              {(id) => <Input id={id} type="tel" value={form.telefon} onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))} />}
            </FormField>
          </div>
          <FormField label="E-posta">
            {(id) => <Input id={id} type="email" value={form.eposta} onChange={(e) => setForm((f) => ({ ...f, eposta: e.target.value }))} />}
          </FormField>
          {hata && <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalAcik(false)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={handleKaydet} loading={yukleniyor} className="flex-1">Bayiyi kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
