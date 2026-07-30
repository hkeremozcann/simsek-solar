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

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader baslik="Tanımlar" aciklama="Sistem genelinde kullanılan listeler" />

      <div className="border-b border-[#D6DCE3] bg-white">
        <nav aria-label="Tanım sekmeleri" className="px-4 md:px-6">
          <ul className="flex gap-0" role="tablist">
            {(['firmalar', 'kullanicilar', 'bayiler'] as TanimSekme[]).map((sekme) => (
              <li key={sekme}>
                <button
                  role="tab"
                  aria-selected={aktifSekme === sekme}
                  onClick={() => setAktifSekme(sekme)}
                  className={cn(
                    'px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize min-h-[44px]',
                    aktifSekme === sekme
                      ? 'border-[#B4531F] text-[#B4531F]'
                      : 'border-transparent text-[#6B7785] hover:text-[#0F1F33]'
                  )}
                >
                  {sekme === 'firmalar' ? 'Firmalar' : sekme === 'kullanicilar' ? 'Kullanıcılar' : 'Bayiler'}
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
  const [modalAcik, setModalAcik] = useState(false)
  const [form, setForm] = useState({ ad: '', kurum_tipi: 'TOKİ' as KurumTipi, ana_yuklenici: '', il: '', telefon: '', genel_eposta: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function handleKaydet() {
    if (!form.ad) { setHata('Firma adı zorunludur.'); return }
    setYukleniyor(true)
    const { error } = await supabase.from('firmalar').insert(form)
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['firmalar'] })
    setModalAcik(false)
    setForm({ ad: '', kurum_tipi: 'TOKİ', ana_yuklenici: '', il: '', telefon: '', genel_eposta: '' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#6B7785]">{firmalar.length} firma</p>
        <Button variant="primary" size="sm" onClick={() => setModalAcik(true)}>+ Firma ekle</Button>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7785]">Yükleniyor…</p> : (
        <Card padding="none">
          <table className="w-full" aria-label="Firmalar listesi">
            <thead>
              <tr className="border-b border-[#D6DCE3]">
                {['Firma Adı', 'Kurum Tipi', 'Ana Yüklenici', 'İl', 'İletişim'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firmalar.map((f) => (
                <tr key={f.id} className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] text-sm">
                  <td className="px-4 py-3 font-medium text-[#0F1F33]">{f.ad}</td>
                  <td className="px-4 py-3 text-[#6B7785]">{f.kurum_tipi}</td>
                  <td className="px-4 py-3 text-[#6B7785]">{f.ana_yuklenici || '—'}</td>
                  <td className="px-4 py-3 text-[#6B7785]">{f.il || '—'}</td>
                  <td className="px-4 py-3 text-[#6B7785]">
                    {f.telefon && <div>{f.telefon}</div>}
                    {f.genel_eposta && <div>{f.genel_eposta}</div>}
                    {!f.telefon && !f.genel_eposta && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {firmalar.length === 0 && (
            <EmptyState baslik="Firma eklenmemiş" />
          )}
        </Card>
      )}

      <Modal acik={modalAcik} kapat={() => setModalAcik(false)} baslik="Yeni firma ekle">
        <div className="space-y-4">
          <FormField label="Firma adı" required error={hata && !form.ad ? hata : undefined}>
            {(id) => <Input id={id} value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} />}
          </FormField>
          <FormField label="Kurum tipi" required>
            {(id) => (
              <Select id={id} value={form.kurum_tipi} onChange={(e) => setForm((f) => ({ ...f, kurum_tipi: e.target.value as KurumTipi }))}>
                {KURUM_TIPLERI.map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label="Ana yüklenici">
            {(id) => <Input id={id} value={form.ana_yuklenici} onChange={(e) => setForm((f) => ({ ...f, ana_yuklenici: e.target.value }))} />}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="İl">
              {(id) => <Input id={id} value={form.il} onChange={(e) => setForm((f) => ({ ...f, il: e.target.value }))} />}
            </FormField>
            <FormField label="Telefon">
              {(id) => <Input id={id} type="tel" value={form.telefon} onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))} />}
            </FormField>
          </div>
          <FormField label="Genel e-posta">
            {(id) => <Input id={id} type="email" value={form.genel_eposta} onChange={(e) => setForm((f) => ({ ...f, genel_eposta: e.target.value }))} />}
          </FormField>
          {hata && <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>}
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

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-[#6B7785]">{kullanicilar.length} kullanıcı</p>
        <p className="text-xs text-[#6B7785] mt-1">
          Yeni kullanıcı eklemek için Supabase panelinden davet gönderin, ardından kullanıcı profilini burada düzenleyin.
        </p>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7785]">Yükleniyor…</p> : (
        <Card padding="none">
          <table className="w-full" aria-label="Kullanıcılar listesi">
            <thead>
              <tr className="border-b border-[#D6DCE3]">
                {['Ad Soyad', 'E-posta', 'Telefon', 'Rol', 'Durum'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide">
                    {h}
                  </th>
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
                    <Badge variant={k.rol === 'yonetici' ? 'info' : 'neutral'}>
                      {ROL_ETIKETLERI[k.rol as KullaniciRolu]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={k.aktif_mi ? 'success' : 'neutral'}>
                      {k.aktif_mi ? '● Aktif' : '○ Pasif'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kullanicilar.length === 0 && (
            <EmptyState baslik="Kullanıcı bulunamadı" />
          )}
        </Card>
      )}
    </div>
  )
}

// ─── Bayiler ──────────────────────────────────────────────────
function BayilerTablosu() {
  const { data: bayiler = [], isLoading } = useBayiler()
  const queryClient = useQueryClient()
  const [modalAcik, setModalAcik] = useState(false)
  const [form, setForm] = useState({ ad: '', yetkili_kisi: '', telefon: '', eposta: '', il: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function handleKaydet() {
    if (!form.ad) { setHata('Bayi adı zorunludur.'); return }
    setYukleniyor(true)
    const { error } = await supabase.from('bayiler').insert({ ...form, aktif_mi: true })
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['bayiler'] })
    setModalAcik(false)
    setForm({ ad: '', yetkili_kisi: '', telefon: '', eposta: '', il: '' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#6B7785]">{bayiler.length} bayi</p>
        <Button variant="primary" size="sm" onClick={() => setModalAcik(true)}>+ Bayi ekle</Button>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7785]">Yükleniyor…</p> : (
        <Card padding="none">
          <table className="w-full" aria-label="Bayiler listesi">
            <thead>
              <tr className="border-b border-[#D6DCE3]">
                {['Bayi Adı', 'Yetkili Kişi', 'İl', 'İletişim'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide">
                    {h}
                  </th>
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
                    {b.telefon && <div>{b.telefon}</div>}
                    {b.eposta && <div>{b.eposta}</div>}
                    {!b.telefon && !b.eposta && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bayiler.length === 0 && (
            <EmptyState baslik="Bayi eklenmemiş" />
          )}
        </Card>
      )}

      <Modal acik={modalAcik} kapat={() => setModalAcik(false)} baslik="Yeni bayi ekle">
        <div className="space-y-4">
          <FormField label="Bayi adı" required>
            {(id) => <Input id={id} value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} />}
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
