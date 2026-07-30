import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Kullanici, KullaniciRolu } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  kullanici: Kullanici | null
  session: Session | null
  yukleniyor: boolean
  girisYap: (eposta: string, sifre: string) => Promise<{ hata?: string }>
  cikisYap: () => Promise<void>
  sifreSifirla: (eposta: string) => Promise<{ hata?: string }>
  rolKontrol: (izinliRoller: KullaniciRolu[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [kullanici, setKullanici] = useState<Kullanici | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function kullaniciBilgisiGetir(userId: string) {
    const { data } = await supabase
      .from('kullanicilar')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setKullanici(data)
  }

  useEffect(() => {
    // Mevcut oturumu yükle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        kullaniciBilgisiGetir(session.user.id).finally(() => setYukleniyor(false))
      } else {
        setYukleniyor(false)
      }
    })

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        kullaniciBilgisiGetir(session.user.id)
      } else {
        setKullanici(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function girisYap(eposta: string, sifre: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: sifre })
    if (error) {
      return { hata: hataMetniCevir(error.message) }
    }
    return {}
  }

  async function cikisYap() {
    await supabase.auth.signOut()
    setKullanici(null)
  }

  async function sifreSifirla(eposta: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(eposta, {
      redirectTo: `${window.location.origin}/sifre-yenile`,
    })
    if (error) return { hata: hataMetniCevir(error.message) }
    return {}
  }

  function rolKontrol(izinliRoller: KullaniciRolu[]): boolean {
    if (!kullanici) return false
    return izinliRoller.includes(kullanici.rol)
  }

  return (
    <AuthContext.Provider value={{
      user, kullanici, session, yukleniyor,
      girisYap, cikisYap, sifreSifirla, rolKontrol,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır')
  return ctx
}

function hataMetniCevir(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.'
  if (msg.includes('Email not confirmed')) return 'E-posta adresinizi doğrulayın.'
  if (msg.includes('Too many requests')) return 'Çok fazla deneme. Lütfen bekleyin.'
  if (msg.includes('User not found')) return 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.'
  return msg
}
