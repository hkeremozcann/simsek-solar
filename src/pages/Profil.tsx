import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { ROL_ETIKETLERI, type KullaniciRolu } from '@/lib/types'

export default function Profil() {
  const { kullanici, kullaniciyiYenile } = useAuth()
  const queryClient = useQueryClient()

  const [profilForm, setProfilForm] = useState({
    ad_soyad: kullanici?.ad_soyad || '',
    telefon: kullanici?.telefon || '',
  })
  const [profilYukleniyor, setProfilYukleniyor] = useState(false)
  const [profilMesaj, setProfilMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null)

  const [sifreForm, setSifreForm] = useState({ yeni: '', tekrar: '' })
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)
  const [sifreMesaj, setSifreMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null)

  async function handleProfilKaydet(e: React.FormEvent) {
    e.preventDefault()
    if (!kullanici) return
    if (!profilForm.ad_soyad.trim()) {
      setProfilMesaj({ tip: 'hata', metin: 'Ad soyad zorunludur.' })
      return
    }
    setProfilYukleniyor(true)
    setProfilMesaj(null)
    const { error } = await supabase
      .from('kullanicilar')
      .update({ ad_soyad: profilForm.ad_soyad, telefon: profilForm.telefon || null })
      .eq('id', kullanici.id)
    setProfilYukleniyor(false)
    if (error) {
      setProfilMesaj({ tip: 'hata', metin: error.message })
    } else {
      await kullaniciyiYenile()
      queryClient.invalidateQueries({ queryKey: ['kullanicilar'] })
      setProfilMesaj({ tip: 'basari', metin: 'Profil bilgileri güncellendi.' })
    }
  }

  async function handleSifreGuncelle(e: React.FormEvent) {
    e.preventDefault()
    if (sifreForm.yeni.length < 6) {
      setSifreMesaj({ tip: 'hata', metin: 'Şifre en az 6 karakter olmalıdır.' })
      return
    }
    if (sifreForm.yeni !== sifreForm.tekrar) {
      setSifreMesaj({ tip: 'hata', metin: 'Şifreler eşleşmiyor.' })
      return
    }
    setSifreYukleniyor(true)
    setSifreMesaj(null)
    const { error } = await supabase.auth.updateUser({ password: sifreForm.yeni })
    setSifreYukleniyor(false)
    if (error) {
      setSifreMesaj({ tip: 'hata', metin: error.message })
    } else {
      setSifreMesaj({ tip: 'basari', metin: 'Şifreniz güncellendi.' })
      setSifreForm({ yeni: '', tekrar: '' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader baslik="Profil ve Ayarlar" aciklama="Hesap bilgilerinizi düzenleyin" />

      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        {/* Profil kartı */}
        <Card>
          <CardHeader title="Kişisel bilgiler" />

          <div className="mb-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: '#1B4B73' }}
              aria-hidden
            >
              {(kullanici?.ad_soyad || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#0F1F33]">{kullanici?.ad_soyad}</p>
              <p className="text-sm text-[#6B7785]">{kullanici?.eposta}</p>
              <Badge variant={kullanici?.rol === 'yonetici' ? 'info' : 'neutral'} className="mt-1">
                {ROL_ETIKETLERI[(kullanici?.rol || 'satis_temsilcisi') as KullaniciRolu]}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleProfilKaydet} noValidate className="space-y-4">
            <FormField label="Ad soyad" required>
              {(id) => (
                <Input
                  id={id}
                  value={profilForm.ad_soyad}
                  onChange={(e) => setProfilForm((f) => ({ ...f, ad_soyad: e.target.value }))}
                />
              )}
            </FormField>
            <FormField label="Telefon">
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  value={profilForm.telefon}
                  onChange={(e) => setProfilForm((f) => ({ ...f, telefon: e.target.value }))}
                  placeholder="+90 5xx xxx xx xx"
                />
              )}
            </FormField>
            <FormField label="E-posta">
              {(id) => (
                <Input id={id} value={kullanici?.eposta || ''} disabled
                  className="bg-[#F5F7F9] text-[#6B7785] cursor-not-allowed" />
              )}
            </FormField>

            {profilMesaj && (
              <div
                className={`text-sm rounded p-3 ${profilMesaj.tip === 'basari' ? 'bg-green-50 text-[#1B7A4B]' : 'bg-red-50 text-[#B3261E]'}`}
                role="alert"
              >
                {profilMesaj.metin}
              </div>
            )}

            <Button type="submit" variant="primary" loading={profilYukleniyor}>
              Profili kaydet
            </Button>
          </form>
        </Card>

        {/* Şifre değiştirme */}
        <Card>
          <CardHeader title="Şifre değiştir" />
          <form onSubmit={handleSifreGuncelle} noValidate className="space-y-4">
            <FormField label="Yeni şifre" required hint="En az 6 karakter">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  value={sifreForm.yeni}
                  onChange={(e) => setSifreForm((f) => ({ ...f, yeni: e.target.value }))}
                  autoComplete="new-password"
                />
              )}
            </FormField>
            <FormField label="Yeni şifre (tekrar)" required>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  value={sifreForm.tekrar}
                  onChange={(e) => setSifreForm((f) => ({ ...f, tekrar: e.target.value }))}
                  autoComplete="new-password"
                  error={sifreForm.tekrar.length > 0 && sifreForm.yeni !== sifreForm.tekrar}
                />
              )}
            </FormField>

            {sifreMesaj && (
              <div
                className={`text-sm rounded p-3 ${sifreMesaj.tip === 'basari' ? 'bg-green-50 text-[#1B7A4B]' : 'bg-red-50 text-[#B3261E]'}`}
                role="alert"
              >
                {sifreMesaj.metin}
              </div>
            )}

            <Button type="submit" variant="secondary" loading={sifreYukleniyor}>
              Şifreyi güncelle
            </Button>
          </form>
        </Card>

        {/* Sistem bilgisi */}
        <Card>
          <CardHeader title="Sistem bilgisi" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-[#F5F7F9]">
              <dt className="text-[#6B7785]">Uygulama</dt>
              <dd className="font-medium">Şimşek Solar CRM</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F5F7F9]">
              <dt className="text-[#6B7785]">Sürüm</dt>
              <dd className="font-mono text-xs">v1.0.0</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-[#6B7785]">Hesap ID</dt>
              <dd className="font-mono text-xs text-[#6B7785] truncate max-w-48">{kullanici?.id}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}
