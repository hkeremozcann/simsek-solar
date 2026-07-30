import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useFirmalar, useKullanicilar, useBayiler } from '@/hooks/useProjects'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField'
import {
  ROL_ETIKETLERI, KURUM_TIPLERI, TURKIYE_ILLERI,
  type KullaniciRolu, type KurumTipi
} from '@/lib/types'
import { cn } from '@/lib/utils'

type AyarSekme = 'genel' | 'firmalar' | 'kullanicilar' | 'bayiler'

export default function Ayarlar() {
  const { kullanici, rolKontrol } = useAuth()
  const [sekme, setSekme] = useState<AyarSekme>('firmalar')

  const SEKMELER = [
    { id: 'firmalar' as AyarSekme, label: '🏢 Firmalar' },
    { id: 'kullanicilar' as AyarSekme, label: '👤 Kullanıcılar', sadecYonetici: true },
    { id: 'bayiler' as AyarSekme, label: '🤝 Bayiler', sadecYonetici: true },
    { id: 'genel' as AyarSekme, label: '⚙ Genel', sadecYonetici: true },
  ].filter(s => !s.sadecYonetici || rolKontrol(['yonetici']))

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader baslik="Ayarlar" aciklama="Sistem tanımları ve yönetim" />

      <div className="border-b border-[#D6DCE3] bg-white sticky top-0 z-10">
        <nav className="px-4 md:px-6 flex overflow-x-auto">
          {SEKMELER.map(s => (
            <button
              key={s.id}
              onClick={() => setSekme(s.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px]',
                sekme === s.id
                  ? 'border-[#B4531F] text-[#B4531F]'
                  : 'border-transparent text-[#6B7785] hover:text-[#0F1F33]'
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6">
        {sekme === 'firmalar' && <FirmalarPaneli />}
        {sekme === 'kullanicilar' && <KullanicilarPaneli />}
        {sekme === 'bayiler' && <BayilerPaneli />}
        {sekme === 'genel' && <GenelAyarlar />}
      </div>
    </div>
  )
}

// ─── Firmalar ─────────────────────────────────────────────────
function FirmalarPaneli() {
  const { data: firmalar = [], isLoading } = useFirmalar()
  const queryClient = useQueryClient()
  const [acik, setAcik] = useState(false)
  const [duzenle, setDuzenle] = useState<string | null>(null)
  const bos = { ad: '', kurum_tipi: 'TOKİ' as KurumTipi, ana_yuklenici: '', il: '', ilce: '', telefon: '', genel_eposta: '', vergi_dairesi: '', vergi_no: '', adres: '', notlar: '' }
  const [form, setForm] = useState(bos)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')

  const filtreli = useMemo(() =>
    firmalar.filter(f =>
      f.ad.toLowerCase().includes(arama.toLowerCase()) ||
      f.kurum_tipi.toLowerCase().includes(arama.toLowerCase()) ||
      (f.il || '').toLowerCase().includes(arama.toLowerCase())
    ), [firmalar, arama])

  function g<K extends keyof typeof bos>(k: K, v: typeof bos[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function yeniAc() {
    setDuzenle(null)
    setForm(bos)
    setHata('')
    setAcik(true)
  }

  function duzenleAc(firma: typeof firmalar[0]) {
    setDuzenle(firma.id)
    setForm({
      ad: firma.ad, kurum_tipi: firma.kurum_tipi as KurumTipi,
      ana_yuklenici: firma.ana_yuklenici || '', il: firma.il || '',
      ilce: firma.ilce || '', telefon: firma.telefon || '',
      genel_eposta: firma.genel_eposta || '', vergi_dairesi: firma.vergi_dairesi || '',
      vergi_no: firma.vergi_no || '', adres: firma.adres || '', notlar: firma.notlar || '',
    })
    setHata('')
    setAcik(true)
  }

  async function kaydet() {
    if (!form.ad.trim()) { setHata('Firma adı zorunludur.'); return }
    setYukleniyor(true); setHata('')
    const payload = {
      ad: form.ad, kurum_tipi: form.kurum_tipi,
      ana_yuklenici: form.ana_yuklenici || null, il: form.il || null,
      ilce: form.ilce || null, telefon: form.telefon || null,
      genel_eposta: form.genel_eposta || null, vergi_dairesi: form.vergi_dairesi || null,
      vergi_no: form.vergi_no || null, adres: form.adres || null, notlar: form.notlar || null,
    }
    const { error } = duzenle
      ? await supabase.from('firmalar').update(payload).eq('id', duzenle)
      : await supabase.from('firmalar').insert(payload)
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['firmalar'] })
    setAcik(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-sm">
          <Input value={arama} onChange={e => setArama(e.target.value)}
            placeholder="Firma ara…" aria-label="Firma ara" />
        </div>
        <Button variant="primary" onClick={yeniAc}>+ Firma ekle</Button>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7785] py-8 text-center">Yükleniyor…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtreli.map(f => (
            <Card key={f.id} className="hover:border-[#1B4B73]/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[#0F1F33] truncate">{f.ad}</p>
                  <p className="text-xs text-[#6B7785] mt-0.5">{f.kurum_tipi}{f.il ? ` · ${f.il}` : ''}</p>
                  {f.ana_yuklenici && <p className="text-xs text-[#6B7785]">Yük: {f.ana_yuklenici}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => duzenleAc(f)} className="flex-shrink-0 text-xs">Düzenle</Button>
              </div>
              {(f.telefon || f.genel_eposta) && (
                <div className="mt-2 pt-2 border-t border-[#D6DCE3] space-y-0.5">
                  {f.telefon && <a href={`tel:${f.telefon}`} className="text-xs text-[#1B4B73] hover:underline block">📞 {f.telefon}</a>}
                  {f.genel_eposta && <a href={`mailto:${f.genel_eposta}`} className="text-xs text-[#1B4B73] hover:underline block truncate">✉ {f.genel_eposta}</a>}
                </div>
              )}
            </Card>
          ))}
          {filtreli.length === 0 && !isLoading && (
            <div className="col-span-full">
              <EmptyState baslik={arama ? 'Arama sonucu bulunamadı' : 'Henüz firma eklenmemiş'}
                eylem={!arama ? <Button variant="primary" onClick={yeniAc}>+ İlk firmayı ekle</Button> : undefined} />
            </div>
          )}
        </div>
      )}

      <Modal acik={acik} kapat={() => setAcik(false)} baslik={duzenle ? 'Firmayı düzenle' : 'Yeni firma ekle'} genislik="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Firma adı" required className="md:col-span-2">
              {id => <Input id={id} value={form.ad} onChange={e => g('ad', e.target.value)} placeholder="örn. TOKİ Gaziantep 3. Etap" error={!!hata && !form.ad} />}
            </FormField>
            <FormField label="Kurum tipi" required>
              {id => <Select id={id} value={form.kurum_tipi} onChange={e => g('kurum_tipi', e.target.value as KurumTipi)}>
                {KURUM_TIPLERI.map(k => <option key={k} value={k}>{k}</option>)}
              </Select>}
            </FormField>
            <FormField label="Ana yüklenici">
              {id => <Input id={id} value={form.ana_yuklenici} onChange={e => g('ana_yuklenici', e.target.value)} placeholder="İnşaat firması" />}
            </FormField>
            <FormField label="İl">
              {id => <Select id={id} value={form.il} onChange={e => g('il', e.target.value)}>
                <option value="">— Seçin —</option>
                {TURKIYE_ILLERI.sort().map(il => <option key={il} value={il}>{il}</option>)}
              </Select>}
            </FormField>
            <FormField label="İlçe">
              {id => <Input id={id} value={form.ilce} onChange={e => g('ilce', e.target.value)} />}
            </FormField>
            <FormField label="Vergi dairesi">
              {id => <Input id={id} value={form.vergi_dairesi} onChange={e => g('vergi_dairesi', e.target.value)} />}
            </FormField>
            <FormField label="Vergi numarası">
              {id => <Input id={id} value={form.vergi_no} onChange={e => g('vergi_no', e.target.value)} />}
            </FormField>
            <FormField label="Telefon">
              {id => <Input id={id} type="tel" value={form.telefon} onChange={e => g('telefon', e.target.value)} />}
            </FormField>
            <FormField label="E-posta">
              {id => <Input id={id} type="email" value={form.genel_eposta} onChange={e => g('genel_eposta', e.target.value)} />}
            </FormField>
            <FormField label="Adres" className="md:col-span-2">
              {id => <Textarea id={id} value={form.adres} onChange={e => g('adres', e.target.value)} />}
            </FormField>
            <FormField label="Notlar" className="md:col-span-2">
              {id => <Textarea id={id} value={form.notlar} onChange={e => g('notlar', e.target.value)} />}
            </FormField>
          </div>
          {hata && <p className="text-sm text-[#B3261E] bg-red-50 p-2 rounded" role="alert">{hata}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAcik(false)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={kaydet} loading={yukleniyor} className="flex-1">
              {duzenle ? 'Güncelle' : 'Firmayı kaydet'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Kullanıcılar / Satış Temsilcileri ───────────────────────
function KullanicilarPaneli() {
  const { data: kullanicilar = [], isLoading } = useKullanicilar()
  const { kullaniciyiYenile } = useAuth()
  const queryClient = useQueryClient()
  const [secilen, setSecilen] = useState<typeof kullanicilar[0] | null>(null)
  const [form, setForm] = useState({ ad_soyad: '', telefon: '', rol: 'satis_temsilcisi' as KullaniciRolu })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  function duzenleAc(k: typeof kullanicilar[0]) {
    setSecilen(k)
    setForm({ ad_soyad: k.ad_soyad, telefon: k.telefon || '', rol: k.rol as KullaniciRolu })
    setHata('')
  }

  async function kaydet() {
    if (!secilen) return
    if (!form.ad_soyad.trim()) { setHata('Ad soyad zorunludur.'); return }
    setYukleniyor(true); setHata('')
    const { error } = await supabase.from('kullanicilar')
      .update({ ad_soyad: form.ad_soyad, telefon: form.telefon || null, rol: form.rol })
      .eq('id', secilen.id)
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['kullanicilar'] })
    await kullaniciyiYenile()
    setSecilen(null)
  }

  const ROL_RENK: Record<KullaniciRolu, 'info' | 'warning' | 'neutral' | 'primary'> = {
    yonetici: 'info',
    satis_sonrasi_sorumlusu: 'primary',
    saha_teknisyeni: 'warning',
    satis_temsilcisi: 'neutral',
    bayi: 'neutral',
  }

  return (
    <div className="space-y-4">
      {/* Nasıl kullanıcı eklenir */}
      <div className="bg-[#1B4B73]/5 border border-[#1B4B73]/20 rounded p-4">
        <p className="text-sm font-semibold text-[#1B4B73] mb-2">Yeni kullanıcı / satış temsilcisi ekleme</p>
        <ol className="text-sm text-[#6B7785] space-y-1 list-decimal list-inside">
          <li><strong>Supabase Dashboard</strong> → Authentication → Users → <strong>"Add user"</strong> tıklayın</li>
          <li>E-posta ve şifre girin → kaydedin</li>
          <li>Kullanıcı otomatik olarak bu listeye eklenir</li>
          <li>Aşağıdan adını ve rolünü düzenleyin</li>
        </ol>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm text-[#1B4B73] underline"
        >
          Supabase Dashboard'u aç →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kullanıcı listesi */}
        <div>
          <h3 className="text-sm font-semibold text-[#0F1F33] mb-3">
            Kayıtlı kullanıcılar ({kullanicilar.length})
          </h3>
          {isLoading ? (
            <p className="text-sm text-[#6B7785]">Yükleniyor…</p>
          ) : kullanicilar.length === 0 ? (
            <EmptyState baslik="Henüz kullanıcı yok" aciklama="Supabase'den kullanıcı ekleyin." />
          ) : (
            <div className="space-y-2">
              {kullanicilar.map(k => (
                <button
                  key={k.id}
                  onClick={() => duzenleAc(k)}
                  className={cn(
                    'w-full text-left p-3 rounded border transition-colors',
                    secilen?.id === k.id
                      ? 'border-[#B4531F] bg-[#B4531F]/5'
                      : 'border-[#D6DCE3] bg-white hover:border-[#6B7785]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#1B4B73' }}
                        aria-hidden
                      >
                        {k.ad_soyad[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F1F33] truncate">{k.ad_soyad}</p>
                        <p className="text-xs text-[#6B7785] truncate">{k.eposta}</p>
                      </div>
                    </div>
                    <Badge variant={ROL_RENK[k.rol as KullaniciRolu]}>
                      {ROL_ETIKETLERI[k.rol as KullaniciRolu].split(' ')[0]}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Düzenleme formu */}
        <div>
          {secilen ? (
            <Card>
              <CardHeader title={`Düzenle: ${secilen.ad_soyad}`} />
              <div className="space-y-3">
                <FormField label="Ad soyad" required>
                  {id => <Input id={id} value={form.ad_soyad}
                    onChange={e => setForm(f => ({ ...f, ad_soyad: e.target.value }))}
                    error={!!hata && !form.ad_soyad} />}
                </FormField>
                <FormField label="Telefon">
                  {id => <Input id={id} type="tel" value={form.telefon}
                    onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} />}
                </FormField>
                <FormField label="Rol" required>
                  {id => (
                    <Select id={id} value={form.rol}
                      onChange={e => setForm(f => ({ ...f, rol: e.target.value as KullaniciRolu }))}>
                      {Object.entries(ROL_ETIKETLERI).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </Select>
                  )}
                </FormField>
                <div className="text-xs text-[#6B7785] bg-[#F5F7F9] p-2 rounded">
                  E-posta: <strong>{secilen.eposta}</strong><br />
                  E-posta değiştirmek için Supabase Dashboard'u kullanın.
                </div>
                {hata && <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSecilen(null)} className="flex-1">İptal</Button>
                  <Button variant="primary" size="sm" onClick={kaydet} loading={yukleniyor} className="flex-1">Kaydet</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#6B7785] text-center p-8 border-2 border-dashed border-[#D6DCE3] rounded">
              Sol listeden bir kullanıcıya tıklayarak düzenleyin
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Bayiler ─────────────────────────────────────────────────
function BayilerPaneli() {
  const { data: bayiler = [], isLoading } = useBayiler()
  const queryClient = useQueryClient()
  const [acik, setAcik] = useState(false)
  const [duzenle, setDuzenle] = useState<string | null>(null)
  const bos = { ad: '', yetkili_kisi: '', telefon: '', eposta: '', il: '' }
  const [form, setForm] = useState(bos)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  function g<K extends keyof typeof bos>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function yeniAc() {
    setDuzenle(null); setForm(bos); setHata(''); setAcik(true)
  }

  function duzenleAc(b: typeof bayiler[0]) {
    setDuzenle(b.id)
    setForm({ ad: b.ad, yetkili_kisi: b.yetkili_kisi || '', telefon: b.telefon || '', eposta: b.eposta || '', il: b.il || '' })
    setHata(''); setAcik(true)
  }

  async function kaydet() {
    if (!form.ad.trim()) { setHata('Bayi adı zorunludur.'); return }
    setYukleniyor(true); setHata('')
    const payload = { ad: form.ad, yetkili_kisi: form.yetkili_kisi || null, telefon: form.telefon || null, eposta: form.eposta || null, il: form.il || null }
    const { error } = duzenle
      ? await supabase.from('bayiler').update(payload).eq('id', duzenle)
      : await supabase.from('bayiler').insert({ ...payload, aktif_mi: true })
    setYukleniyor(false)
    if (error) { setHata(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['bayiler'] })
    setAcik(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#6B7785]">{bayiler.length} bayi</p>
        <Button variant="primary" onClick={yeniAc}>+ Bayi ekle</Button>
      </div>

      {isLoading ? <p className="text-sm text-[#6B7785] py-8 text-center">Yükleniyor…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bayiler.map(b => (
            <Card key={b.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#0F1F33]">{b.ad}</p>
                  {b.yetkili_kisi && <p className="text-xs text-[#6B7785]">{b.yetkili_kisi}</p>}
                  {b.il && <p className="text-xs text-[#6B7785]">{b.il}</p>}
                  <div className="mt-1 space-y-0.5">
                    {b.telefon && <a href={`tel:${b.telefon}`} className="text-xs text-[#1B4B73] hover:underline block">📞 {b.telefon}</a>}
                    {b.eposta && <a href={`mailto:${b.eposta}`} className="text-xs text-[#1B4B73] hover:underline block">{b.eposta}</a>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => duzenleAc(b)} className="text-xs flex-shrink-0">Düzenle</Button>
              </div>
            </Card>
          ))}
          {bayiler.length === 0 && <div className="col-span-full"><EmptyState baslik="Henüz bayi eklenmemiş" eylem={<Button variant="primary" onClick={yeniAc}>+ Bayi ekle</Button>} /></div>}
        </div>
      )}

      <Modal acik={acik} kapat={() => setAcik(false)} baslik={duzenle ? 'Bayiyi düzenle' : 'Yeni bayi ekle'}>
        <div className="space-y-3">
          <FormField label="Bayi adı" required>
            {id => <Input id={id} value={form.ad} onChange={e => g('ad', e.target.value)} error={!!hata && !form.ad} />}
          </FormField>
          <FormField label="Yetkili kişi">
            {id => <Input id={id} value={form.yetkili_kisi} onChange={e => g('yetkili_kisi', e.target.value)} />}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="İl">
              {id => <Select id={id} value={form.il} onChange={e => g('il', e.target.value)}>
                <option value="">— Seçin —</option>
                {TURKIYE_ILLERI.sort().map(il => <option key={il} value={il}>{il}</option>)}
              </Select>}
            </FormField>
            <FormField label="Telefon">
              {id => <Input id={id} type="tel" value={form.telefon} onChange={e => g('telefon', e.target.value)} />}
            </FormField>
          </div>
          <FormField label="E-posta">
            {id => <Input id={id} type="email" value={form.eposta} onChange={e => g('eposta', e.target.value)} />}
          </FormField>
          {hata && <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAcik(false)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={kaydet} loading={yukleniyor} className="flex-1">
              {duzenle ? 'Güncelle' : 'Bayiyi kaydet'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Genel Ayarlar ────────────────────────────────────────────
function GenelAyarlar() {
  const navigate = useNavigate()
  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <CardHeader title="Hızlı erişim" />
        <div className="space-y-2">
          {[
            { label: '+ Yeni proje oluştur', href: '/projeler/yeni', renk: '#B4531F' },
            { label: '👤 Profil ve şifre değiştir', href: '/profil', renk: '#1B4B73' },
            { label: '◫ Tüm projeleri gör', href: '/projeler', renk: '#6B7785' },
            { label: '≡ Raporlar', href: '/raporlar', renk: '#6B7785' },
          ].map(link => (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className="w-full text-left text-sm px-3 py-2.5 rounded border border-[#D6DCE3] hover:border-[#B4531F] hover:bg-[#F5F7F9] transition-colors flex items-center justify-between min-h-[44px]"
              style={{ color: link.renk }}
            >
              <span>{link.label}</span>
              <span className="text-[#D6DCE3]">›</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Sistem bilgisi" />
        <dl className="text-sm space-y-2">
          {[
            ['Uygulama', 'Şimşek Solar CRM'],
            ['Sürüm', 'v1.0.0'],
            ['Veritabanı', 'Supabase (PostgreSQL)'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 border-b border-[#F5F7F9] last:border-0">
              <dt className="text-[#6B7785]">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
