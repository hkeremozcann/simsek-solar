import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Proje, Blok, BlokAsamasi, AsamaDurumu, AsamaSonucu } from '@/lib/types'
import { projeKoduUret, blokAdlariUret } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

// ─── Projeler listesi ────────────────────────────────────────
export function useProjects(filters?: {
  durum?: string
  il?: string
  kurum_tipi?: string
  satis_temsilcisi_id?: string
}) {
  return useQuery({
    queryKey: ['projeler', filters],
    queryFn: async () => {
      let query = supabase
        .from('projeler')
        .select(`
          *,
          firma:firmalar(id, ad, kurum_tipi),
          satis_temsilcisi:kullanicilar!satis_temsilcisi_id(id, ad_soyad, eposta),
          bayi:bayiler(id, ad)
        `)
        .order('olusturma_tarihi', { ascending: false })

      if (filters?.durum && filters.durum !== 'tumu') {
        query = query.eq('durum', filters.durum)
      }
      if (filters?.il) {
        query = query.eq('il', filters.il)
      }
      if (filters?.satis_temsilcisi_id) {
        query = query.eq('satis_temsilcisi_id', filters.satis_temsilcisi_id)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Proje[]
    },
  })
}

// ─── Tek proje detayı ────────────────────────────────────────
export function useProject(id: string) {
  return useQuery({
    queryKey: ['proje', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projeler')
        .select(`
          *,
          firma:firmalar(*),
          satis_temsilcisi:kullanicilar!satis_temsilcisi_id(*),
          bayi:bayiler(*),
          bloklar(
            *,
            asamalar:blok_asamalari(
              *,
              kontrol_eden:kullanicilar!kontrol_eden_id(id, ad_soyad)
            )
          ),
          santiye_yetkilileri(*),
          rapor_alicilari(*),
          proje_dokumanlari(*),
          saha_raporlari(
            *,
            hazirlayan:kullanicilar!hazirlayan_id(id, ad_soyad)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Blokları sıra_no'ya göre sırala, aşamaları sıra_no'ya göre
      if (data?.bloklar) {
        data.bloklar.sort((a: Blok, b: Blok) => a.sira_no - b.sira_no)
        data.bloklar.forEach((blok: Blok) => {
          if (blok.asamalar) {
            blok.asamalar.sort((a: BlokAsamasi, b: BlokAsamasi) => a.sira_no - b.sira_no)
          }
        })
      }
      return data as Proje
    },
  })
}

// ─── Proje oluşturma ─────────────────────────────────────────
export function useCreateProject() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async (form: {
      proje: Omit<Proje, 'id' | 'proje_kodu' | 'olusturan_id' | 'olusturma_tarihi' | 'guncelleme_tarihi' | 'durum' | 'aktif_mi'>
      blokAdlandirmaTipi: 'harf' | 'sayi'
      santiyeYetkilileri: { ad_soyad: string; gorevi?: string; telefon?: string; eposta?: string; birincil_mi: boolean }[]
      raporAlicilari: { eposta: string; ad_soyad?: string; alici_tipi: 'Kime' | 'Bilgi' }[]
    }) => {
      if (!kullanici) throw new Error('Giriş yapılmamış')

      // Sıra no için en yüksek mevcut numarayı bul
      const { data: sonPrj } = await supabase
        .from('projeler')
        .select('proje_kodu')
        .order('olusturma_tarihi', { ascending: false })
        .limit(1)
        .single()

      let siraNo = 1
      if (sonPrj?.proje_kodu) {
        const parts = sonPrj.proje_kodu.split('-')
        siraNo = (parseInt(parts[2] || '0') || 0) + 1
      }

      const proje_kodu = projeKoduUret(siraNo)

      // Proje oluştur
      const { data: yeniProje, error: projeError } = await supabase
        .from('projeler')
        .insert({
          ...form.proje,
          proje_kodu,
          durum: 'Çalışıyor',
          aktif_mi: true,
          olusturan_id: kullanici.id,
        })
        .select()
        .single()

      if (projeError) throw projeError

      // Blokları ve aşamaları oluştur
      const blokAdlari = blokAdlariUret(form.proje.blok_sayisi, form.blokAdlandirmaTipi)

      for (let i = 0; i < blokAdlari.length; i++) {
        const { data: blok, error: blokError } = await supabase
          .from('bloklar')
          .insert({
            proje_id: yeniProje.id,
            blok_adi: blokAdlari[i],
            sira_no: i + 1,
          })
          .select()
          .single()

        if (blokError) throw blokError

        // 5 aşama
        const { error: asamaError } = await supabase.from('blok_asamalari').insert([
          { blok_id: blok.id, asama_tipi: 'Kaide Kontrolü', sira_no: 1, durum: 'Başlamadı' },
          { blok_id: blok.id, asama_tipi: 'Dizilim', sira_no: 2, durum: 'Başlamadı' },
          { blok_id: blok.id, asama_tipi: 'Borulama', sira_no: 3, durum: 'Başlamadı' },
          { blok_id: blok.id, asama_tipi: 'Pano Bağlantısı', sira_no: 4, durum: 'Başlamadı' },
          { blok_id: blok.id, asama_tipi: 'Devreye Alma', sira_no: 5, durum: 'Başlamadı' },
        ])
        if (asamaError) throw asamaError
      }

      // Proje desteği kapsamındaysa dokümanlar
      if (form.proje.montaj_kapsami?.includes('Proje Desteği')) {
        await supabase.from('proje_dokumanlari').insert([
          { proje_id: yeniProje.id, dokuman_tipi: 'Kaide Projesi', durum: 'Başlamadı' },
          { proje_id: yeniProje.id, dokuman_tipi: 'Borulama Projesi', durum: 'Başlamadı' },
          { proje_id: yeniProje.id, dokuman_tipi: 'Uygulama Projesi', durum: 'Başlamadı' },
        ])
      }

      // Şantiye yetkilileri
      if (form.santiyeYetkilileri.length > 0) {
        await supabase.from('santiye_yetkilileri').insert(
          form.santiyeYetkilileri.map((sy) => ({ ...sy, proje_id: yeniProje.id }))
        )
      }

      // Rapor alıcıları
      if (form.raporAlicilari.length > 0) {
        await supabase.from('rapor_alicilari').insert(
          form.raporAlicilari.map((ra) => ({ ...ra, proje_id: yeniProje.id, aktif_mi: true }))
        )
      }

      // Aktivite logu
      await supabase.from('aktivite_logu').insert({
        kullanici_id: kullanici.id,
        tablo: 'projeler',
        kayit_id: yeniProje.id,
        islem: 'ekleme',
        yeni_deger: { proje_kodu: yeniProje.proje_kodu, proje_adi: yeniProje.proje_adi },
      })

      return yeniProje
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projeler'] })
    },
  })
}

// ─── Blok aşaması güncelleme ─────────────────────────────────
export function useUpdateAshama() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async ({
      asamaId,
      projeId,
      blokId,
      durum,
      sonuc,
      aciklama,
      oncekiAsama,
      kuralAtlandi,
    }: {
      asamaId: string
      projeId: string
      blokId: string
      durum: AsamaDurumu
      sonuc?: AsamaSonucu
      aciklama?: string
      oncekiAsama?: { durum: AsamaDurumu; sonuc?: AsamaSonucu; aciklama?: string }
      kuralAtlandi?: boolean
    }) => {
      if (!kullanici) throw new Error('Giriş yapılmamış')

      const guncellemeKaydı = {
        kullanici_id: kullanici.id,
        kullanici_adi: kullanici.ad_soyad,
        tarih: new Date().toISOString(),
        eski_durum: oncekiAsama?.durum,
        yeni_durum: durum,
        eski_sonuc: oncekiAsama?.sonuc,
        yeni_sonuc: sonuc,
        aciklama,
        kural_atlandi_mi: kuralAtlandi,
      }

      // Mevcut geçmişi al
      const { data: mevcut } = await supabase
        .from('blok_asamalari')
        .select('guncelleme_gecmisi')
        .eq('id', asamaId)
        .single()

      const eskiGecmis = (mevcut?.guncelleme_gecmisi || []) as unknown[]

      const { error } = await supabase
        .from('blok_asamalari')
        .update({
          durum,
          sonuc: durum === 'Tamamlandı' ? sonuc : null,
          aciklama,
          kontrol_tarihi: durum === 'Tamamlandı' ? new Date().toISOString() : null,
          kontrol_eden_id: kullanici.id,
          duzeltme_talep_edildi_mi: sonuc === 'Hatalı',
          guncelleme_gecmisi: [...eskiGecmis, guncellemeKaydı],
        })
        .eq('id', asamaId)

      if (error) throw error

      // Log
      await supabase.from('aktivite_logu').insert({
        kullanici_id: kullanici.id,
        tablo: 'blok_asamalari',
        kayit_id: asamaId,
        islem: 'guncelleme',
        eski_deger: oncekiAsama,
        yeni_deger: { durum, sonuc, aciklama },
      })

      return { asamaId, blokId, projeId }
    },
    onSuccess: ({ projeId }) => {
      queryClient.invalidateQueries({ queryKey: ['proje', projeId] })
      queryClient.invalidateQueries({ queryKey: ['projeler'] })
    },
  })
}

// ─── Firmalar listesi ─────────────────────────────────────────
export function useFirmalar() {
  return useQuery({
    queryKey: ['firmalar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('firmalar')
        .select('*')
        .order('ad')
      if (error) throw error
      return data
    },
  })
}

// ─── Kullanıcılar listesi ─────────────────────────────────────
export function useKullanicilar() {
  return useQuery({
    queryKey: ['kullanicilar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('aktif_mi', true)
        .order('ad_soyad')
      if (error) throw error
      return data
    },
  })
}

// ─── Bayiler listesi ──────────────────────────────────────────
export function useBayiler() {
  return useQuery({
    queryKey: ['bayiler'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bayiler')
        .select('*')
        .eq('aktif_mi', true)
        .order('ad')
      if (error) throw error
      return data
    },
  })
}

// ─── Dashboard istatistikleri ──────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [aktifRes, tamamlananRes, acikHataRes] = await Promise.all([
        supabase.from('projeler').select('id', { count: 'exact' }).eq('aktif_mi', true),
        supabase.from('projeler').select('id', { count: 'exact' }).eq('durum', 'Tamamlandı'),
        supabase.from('blok_asamalari').select('id', { count: 'exact' }).eq('sonuc', 'Hatalı'),
      ])

      // Bu ay devreye alınan bloklar
      const buAyBaslangic = new Date()
      buAyBaslangic.setDate(1)
      buAyBaslangic.setHours(0, 0, 0, 0)

      const { count: buAyBlok } = await supabase
        .from('blok_asamalari')
        .select('id', { count: 'exact' })
        .eq('asama_tipi', 'Devreye Alma')
        .eq('durum', 'Tamamlandı')
        .eq('sonuc', 'Uygun')
        .gte('kontrol_tarihi', buAyBaslangic.toISOString())

      return {
        aktifProje: aktifRes.count ?? 0,
        tamamlananProje: tamamlananRes.count ?? 0,
        acikHata: acikHataRes.count ?? 0,
        buAyDevreAlınan: buAyBlok ?? 0,
      }
    },
  })
}
