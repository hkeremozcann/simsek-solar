import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/ui/FormField'

export default function Giris() {
  const { girisYap, sifreSifirla } = useAuth()
  const navigate = useNavigate()
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [sifreSifirlaAcik, setSifreSifirlaAcik] = useState(false)
  const [sifirlaEposta, setSifirlaEposta] = useState('')
  const [sifirlaBasarili, setSifirlaBasarili] = useState(false)
  const [sifirlaYukleniyor, setSifirlaYukleniyor] = useState(false)

  async function handleGiris(e: React.FormEvent) {
    e.preventDefault()
    if (!eposta || !sifre) {
      setHata('E-posta ve şifre zorunludur.')
      return
    }
    setYukleniyor(true)
    setHata('')
    const { hata: err } = await girisYap(eposta, sifre)
    setYukleniyor(false)
    if (err) {
      setHata(err)
    } else {
      navigate('/panel')
    }
  }

  async function handleSifreSifirla(e: React.FormEvent) {
    e.preventDefault()
    if (!sifirlaEposta) return
    setSifirlaYukleniyor(true)
    const { hata: err } = await sifreSifirla(sifirlaEposta)
    setSifirlaYukleniyor(false)
    if (err) {
      setHata(err)
    } else {
      setSifirlaBasarili(true)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#F5F7F9] flex items-center justify-center p-4"
      style={{ backgroundImage: 'linear-gradient(135deg, #0F1F33 0%, #1B4B73 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-4"
            style={{ backgroundColor: '#B4531F' }}
            aria-hidden
          >
            <span className="text-white text-3xl">☀</span>
          </div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            Şimşek Solar
          </h1>
          <p className="text-white/60 text-sm mt-1">Proje ve Saha Takip Sistemi</p>
        </div>

        {/* Kart */}
        <div className="bg-white rounded border border-[#D6DCE3] p-6 shadow-lg">
          {!sifreSifirlaAcik ? (
            <>
              <h2
                className="text-lg font-semibold text-[#0F1F33] mb-5"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Sisteme giriş yapın
              </h2>

              <form onSubmit={handleGiris} noValidate className="space-y-4">
                <FormField label="E-posta" required>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      type="email"
                      autoComplete="email"
                      value={eposta}
                      onChange={(e) => setEposta(e.target.value)}
                      placeholder="ornek@simseksolar.com"
                      aria-describedby={describedBy}
                      error={!!hata}
                    />
                  )}
                </FormField>

                <FormField label="Şifre" required>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      type="password"
                      autoComplete="current-password"
                      value={sifre}
                      onChange={(e) => setSifre(e.target.value)}
                      aria-describedby={describedBy}
                      error={!!hata}
                    />
                  )}
                </FormField>

                {hata && (
                  <div
                    className="text-sm text-[#B3261E] bg-red-50 border border-[#B3261E]/20 rounded px-3 py-2"
                    role="alert"
                    aria-live="polite"
                  >
                    {hata}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={yukleniyor}
                  className="w-full"
                >
                  Giriş yap
                </Button>
              </form>

              <button
                onClick={() => { setSifreSifirlaAcik(true); setHata('') }}
                className="mt-4 text-sm text-[#1B4B73] hover:underline w-full text-center"
              >
                Şifremi unuttum
              </button>
            </>
          ) : (
            <>
              <h2
                className="text-lg font-semibold text-[#0F1F33] mb-2"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Şifre sıfırlama
              </h2>
              {sifirlaBasarili ? (
                <div className="text-sm text-[#1B7A4B] bg-green-50 border border-[#1B7A4B]/20 rounded p-3 mb-4">
                  Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
                </div>
              ) : (
                <form onSubmit={handleSifreSifirla} noValidate className="space-y-4">
                  <p className="text-sm text-[#6B7785] mb-4">
                    Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                  </p>
                  <FormField label="E-posta" required>
                    {(id) => (
                      <Input
                        id={id}
                        type="email"
                        autoComplete="email"
                        value={sifirlaEposta}
                        onChange={(e) => setSifirlaEposta(e.target.value)}
                      />
                    )}
                  </FormField>
                  {hata && (
                    <p className="text-sm text-[#B3261E]" role="alert">{hata}</p>
                  )}
                  <Button type="submit" variant="primary" loading={sifirlaYukleniyor} className="w-full">
                    Sıfırlama bağlantısı gönder
                  </Button>
                </form>
              )}
              <button
                onClick={() => { setSifreSifirlaAcik(false); setHata('') }}
                className="mt-4 text-sm text-[#6B7785] hover:text-[#0F1F33] transition-colors"
              >
                ← Geri dön
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
