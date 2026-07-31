import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  Proje, Blok, BlokAsamasi, AsamaDurumu, AsamaSonucu,
  Hata, EksikImalat, MvProjeOzet
} from '@/lib/types'
import { blokAdlariUret } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

// MV yenile + tüm ilgili cache'leri temizle
async function yenileVeTemizle(queryClient: QueryClient, projeId?: string) {
  try { await supabase.rpc('yenile_proje_ozet') } catch { /* MV yoksa pas geç */ }
  // Tüm ilgili cache'leri temizle — proje silinince tüm ekranlar güncellensin
  const keys = [
    'mv-proje-ozet', 'portfoy-stats', 'dashboard-stats',
    'projeler', 'tum-hatalar', 'tum-saha-raporlari', 'eksik-imalatlar',
  ]
  keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }))
  if (projeId) {
    queryClient.invalidateQueries({ queryKey: ['proje', projeId] })
    queryClient.invalidateQueries({ queryKey: ['hatalar', projeId] })
  }
}
import { SAYFA_BOYUTU } from '@/config/firma'

// ─── Projeler listesi (MV ile hızlı) ─────────────────────────
export function useProjects(filters?: {
  durum?: string
  il?: string
  satis_temsilcisi_id?: string
  arama?: string
  sadece_hatali?: boolean
  sadece_gecikmiş?: boolean
  sayfa?: number
}) {
  return useQuery({
    queryKey: ['projeler', filters],
    queryFn: async () => {
      let query = supabase
        .from('projeler')
        .select(`
          *,
          firma:firmalar(id, ad, kurum_tipi),
          satis_temsilcisi:kullanicilar!satis_temsilcisi_id(id, ad_soyad),
          bayi:bayiler(id, ad)
        `, { count: 'exact' })
        .eq('silindi_mi', false)
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
      if (filters?.arama) {
        query = query.or(
          `proje_adi.ilike.%${filters.arama}%,proje_kodu.ilike.%${filters.arama}%`
        )
      }

      // Sayfalama
      const sayfa = filters?.sayfa ?? 0
      query = query.range(sayfa * SAYFA_BOYUTU, (sayfa + 1) * SAYFA_BOYUTU - 1)

      const { data, error, count } = await query
      if (error) throw error
      return { projeler: (data ?? []) as Proje[], toplam: count ?? 0 }
    },
  })
}

// ─── Tek proje detayı ─────────────────────────────────────────
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
          satis_temsilcisi:kullanicilar!satis_temsilcisi_id(id, ad_soyad, eposta, telefon),
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

      // Blok ve aşamaları sırala
      if (data?.bloklar) {
        data.bloklar.sort((a: Blok, b: Blok) => a.sira_no - b.sira_no)
        data.bloklar.forEach((blok: Blok) => {
          blok.asamalar?.sort((a: BlokAsamasi, b: BlokAsamasi) => a.sira_no - b.sira_no)
        })
      }
      return data as Proje
    },
  })
}

// ─── Proje oluşturma (V2: proje_kodu DB'de üretilir) ─────────
export function useCreateProject() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async (form: {
      proje: {
        proje_adi: string
        firma_id: string
        sozlesme_no?: string
        sozlesme_tarihi?: string
        hedef_teslim_tarihi?: string
        santiye_adresi: string
        il: string
        ilce?: string
        satis_temsilcisi_id: string
        bayi_id?: string
        montaj_kapsami: string[]
        blok_sayisi: number
        toplam_kollektor_sayisi: number
        toplam_sehpa_sayisi: number
        toplam_pano_sayisi?: number
        boyler_sayisi?: number
        boyler_kapasitesi_lt?: number
        pompa_grubu_sayisi?: number
        sistem_tipi?: string
        notlar?: string
      }
      blokAdlandirmaTipi: 'harf' | 'sayi'
      santiyeYetkilileri: {
        ad_soyad: string; gorevi?: string
        telefon?: string; eposta?: string; birincil_mi: boolean
      }[]
      raporAlicilari: {
        eposta: string; ad_soyad?: string; alici_tipi: 'Kime' | 'Bilgi'
      }[]
    }) => {
      if (!kullanici) throw new Error('Giriş yapılmamış')

      // Proje oluştur — proje_kodu DB sequence ile otomatik üretilir
      const { data: yeniProje, error: projeError } = await supabase
        .from('projeler')
        .insert({
          ...form.proje,
          durum: 'Çalışıyor',
          aktif_mi: true,
          taslak_mi: false,
          silindi_mi: false,
          olusturan_id: kullanici.id,
          son_hareket_tarihi: new Date().toISOString(),
        })
        .select()
        .single()

      if (projeError) throw projeError

      // Bloklar ve aşamalar — tek seferde
      const blokAdlari = blokAdlariUret(form.proje.blok_sayisi, form.blokAdlandirmaTipi)
      for (let i = 0; i < blokAdlari.length; i++) {
        const { data: blok, error: blokError } = await supabase
          .from('bloklar')
          .insert({ proje_id: yeniProje.id, blok_adi: blokAdlari[i], sira_no: i + 1 })
          .select()
          .single()
        if (blokError) throw blokError

        const { error: asamaError } = await supabase.from('blok_asamalari').insert([
          { blok_id: blok.id, asama_tipi: 'Kaide Kontrolü',  sira_no: 1, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1 },
          { blok_id: blok.id, asama_tipi: 'Dizilim',         sira_no: 2, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1 },
          { blok_id: blok.id, asama_tipi: 'Borulama',        sira_no: 3, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1 },
          { blok_id: blok.id, asama_tipi: 'Pano Bağlantısı', sira_no: 4, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1 },
          { blok_id: blok.id, asama_tipi: 'Devreye Alma',    sira_no: 5, durum: 'Başlamadı', kontrol_sayisi: 0, surum: 1 },
        ])
        if (asamaError) throw asamaError
      }

      // Proje Desteği kapsamı → doküman kayıtları
      if (form.proje.montaj_kapsami?.includes('Proje Desteği')) {
        await supabase.from('proje_dokumanlari').insert([
          { proje_id: yeniProje.id, dokuman_tipi: 'Kaide Projesi',    durum: 'Başlamadı' },
          { proje_id: yeniProje.id, dokuman_tipi: 'Borulama Projesi', durum: 'Başlamadı' },
          { proje_id: yeniProje.id, dokuman_tipi: 'Uygulama Projesi', durum: 'Başlamadı' },
        ])
      }

      // Şantiye yetkilileri
      if (form.santiyeYetkilileri.length > 0) {
        await supabase.from('santiye_yetkilileri').insert(
          form.santiyeYetkilileri.filter(s => s.ad_soyad).map(s => ({ ...s, proje_id: yeniProje.id }))
        )
      }

      // Rapor alıcıları
      if (form.raporAlicilari.length > 0) {
        await supabase.from('rapor_alicilari').insert(
          form.raporAlicilari.filter(r => r.eposta).map(r => ({ ...r, proje_id: yeniProje.id, aktif_mi: true }))
        )
      }

      // Aktivite logu
      await supabase.from('aktivite_logu').insert({
        kullanici_id: kullanici.id,
        tablo: 'projeler',
        kayit_id: yeniProje.id,
        proje_id: yeniProje.id,
        islem: 'ekleme',
        yeni_deger: yeniProje.proje_kodu,
      })

      return yeniProje
    },
    onSuccess: () => {
      yenileVeTemizle(queryClient)
    },
  })
}

// ─── Proje güncelleme ─────────────────────────────────────────
export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Proje> }) => {
      const { error } = await supabase.from('projeler').update(data).eq('id', id)
      if (error) throw error
      await supabase.from('aktivite_logu').insert({
        kullanici_id: kullanici?.id,
        tablo: 'projeler', kayit_id: id, proje_id: id, islem: 'guncelleme',
      })
    },
    onSuccess: (_data, { id }) => {
      yenileVeTemizle(queryClient, id)
    },
  })
}

// ─── Aşama güncelleme (V2: surum kontrolü + hata otomasyonu) ─
export function useUpdateAsama() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async ({
      asamaId, projeId, durum, sonuc, aciklama, mevcutSurum,
    }: {
      asamaId: string
      projeId: string
      durum: AsamaDurumu
      sonuc?: AsamaSonucu
      aciklama?: string
      mevcutSurum: number
    }) => {
      if (!kullanici) throw new Error('Giriş yapılmamış')

      const { data: mevcut, error: fetchErr } = await supabase
        .from('blok_asamalari')
        .select('surum, kontrol_sayisi, ilk_kontrol_sonucu, durum')
        .eq('id', asamaId)
        .single()
      if (fetchErr) throw fetchErr

      // K9: Optimistic locking
      if (mevcut.surum !== mevcutSurum) {
        throw new Error(`EŞZAMANLILIK_HATASI: Bu aşama başka biri tarafından güncellendi.`)
      }

      const yeniKontrolSayisi = durum === 'Tamamlandı' ? (mevcut.kontrol_sayisi || 0) + 1 : mevcut.kontrol_sayisi

      const { error } = await supabase.from('blok_asamalari').update({
        durum,
        sonuc: durum === 'Tamamlandı' ? sonuc : null,
        aciklama,
        kontrol_tarihi: durum === 'Tamamlandı' ? new Date().toISOString() : null,
        baslama_tarihi: durum === 'Devam Ediyor' && !mevcut.durum?.includes('Devam')
          ? new Date().toISOString() : undefined,
        kontrol_eden_id: kullanici.id,
        kontrol_sayisi: yeniKontrolSayisi,
        ilk_kontrol_sonucu: yeniKontrolSayisi === 1 && durum === 'Tamamlandı'
          ? sonuc
          : mevcut.ilk_kontrol_sonucu,
        surum: mevcutSurum + 1,
      }).eq('id', asamaId)

      if (error) throw error

      // Proje son_hareket_tarihi güncelle
      await supabase.from('projeler')
        .update({ son_hareket_tarihi: new Date().toISOString() })
        .eq('id', projeId)

      await supabase.from('aktivite_logu').insert({
        kullanici_id: kullanici.id,
        tablo: 'blok_asamalari',
        kayit_id: asamaId,
        proje_id: projeId,
        islem: 'guncelleme',
        alan: 'durum',
        eski_deger: mevcut.durum,
        yeni_deger: `${durum}${sonuc ? ` (${sonuc})` : ''}`,
      })
    },
    onSuccess: (_data, { projeId }) => {
      yenileVeTemizle(queryClient, projeId)
    },
  })
}

// ─── Proje kalıcı silme (sadece Yönetici) ──────────────────────
export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async ({ id, onayKodu }: { id: string; onayKodu: string }) => {
      if (!kullanici || kullanici.rol !== 'yonetici') throw new Error('Sadece yönetici silebilir.')

      // Proje kodunu doğrula
      const { data: proje } = await supabase.from('projeler').select('proje_kodu').eq('id', id).single()
      if (!proje || proje.proje_kodu !== onayKodu) {
        throw new Error('Proje kodu hatalı. Silme işlemi iptal edildi.')
      }

      // durum ve manuel_durum birlikte İptal yap → filtreden düşer
      const { error } = await supabase.from('projeler').update({
        durum: 'İptal',
        manuel_durum: 'İptal',
        aktif_mi: false,
      }).eq('id', id)
      if (error) throw new Error(`Silme başarısız: ${error.message}`)
    },
    onSuccess: () => {
      yenileVeTemizle(queryClient)
    },
  })
}

// ─── Proje arşivleme (yumuşak silme) ──────────────────────────
export function useArchiveProject() {
  const queryClient = useQueryClient()
  const { kullanici } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projeler')
        .update({ manuel_durum: 'İptal', aktif_mi: false })
        .eq('id', id)
      if (error) throw error
      await supabase.from('aktivite_logu').insert({
        kullanici_id: kullanici?.id,
        tablo: 'projeler', kayit_id: id, proje_id: id, islem: 'guncelleme',
        yeni_deger: 'İptal (arşivlendi)',
      })
    },
    onSuccess: () => {
      yenileVeTemizle(queryClient)
    },
  })
}

// ─── Firmalar ─────────────────────────────────────────────────
export function useFirmalar() {
  return useQuery({
    queryKey: ['firmalar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('firmalar').select('*')
        .eq('silindi_mi', false).order('ad')
      if (error) throw error
      return data ?? []
    },
  })
}

// ─── Kullanıcılar ─────────────────────────────────────────────
export function useKullanicilar() {
  return useQuery({
    queryKey: ['kullanicilar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kullanicilar').select('*')
        .eq('aktif_mi', true).order('ad_soyad')
      if (error) { console.warn('kullanicilar:', error.message); return [] }
      return data ?? []
    },
  })
}

// ─── Bayiler ─────────────────────────────────────────────────
export function useBayiler() {
  return useQuery({
    queryKey: ['bayiler'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bayiler').select('*')
        .eq('aktif_mi', true).order('ad')
      if (error) throw error
      return data ?? []
    },
  })
}

// ─── Hatalar (proje bazlı) ────────────────────────────────────
export function useHatalar(projeId?: string) {
  return useQuery({
    queryKey: ['hatalar', projeId],
    queryFn: async () => {
      let q = supabase.from('hatalar').select(`
        *,
        tespit_eden:kullanicilar!tespit_eden_id(id, ad_soyad),
        atanan:kullanicilar!atanan_id(id, ad_soyad)
      `).order('olusturma_tarihi', { ascending: false })
      if (projeId) q = q.eq('proje_id', projeId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Hata[]
    },
  })
}

// ─── Eksik imalatlar ─────────────────────────────────────────
export function useEksikImalatlar(projeId?: string) {
  return useQuery({
    queryKey: ['eksik-imalatlar', projeId],
    queryFn: async () => {
      if (!projeId) {
        // Genel liste: sadece aktif projelerin imalatlarını getir
        const { data: aktifPrjler } = await supabase
          .from('projeler').select('id').neq('durum', 'İptal').eq('silindi_mi', false)
        const aktifIds = (aktifPrjler ?? []).map(p => p.id)
        if (aktifIds.length === 0) return []
        const { data, error } = await supabase.from('eksik_imalatlar').select('*')
          .in('proje_id', aktifIds)
          .order('engelleyici_mi', { ascending: false })
          .order('olusturma_tarihi', { ascending: false })
        if (error) throw error
        return (data ?? []) as EksikImalat[]
      }
      const { data, error } = await supabase.from('eksik_imalatlar').select('*')
        .eq('proje_id', projeId)
        .order('engelleyici_mi', { ascending: false })
        .order('olusturma_tarihi', { ascending: false })
      if (error) throw error
      return (data ?? []) as EksikImalat[]
    },
  })
}

// ─── Dashboard istatistikleri ─────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const [aktif, tamamlanan, acikHata, sureciHata, gecikmisPrj] = await Promise.all([
        supabase.from('projeler').select('id', { count: 'exact', head: true }).eq('aktif_mi', true).eq('silindi_mi', false),
        supabase.from('projeler').select('id', { count: 'exact', head: true }).eq('durum', 'Tamamlandı'),
        // Hata sorgularında İptal projeleri hariç tut
        supabase.from('hatalar').select('id, proje:projeler!inner(durum, silindi_mi)', { count: 'exact', head: true })
          .in('durum', ['Açık', 'Düzeltiliyor', 'Yeniden Kontrolde'])
          .neq('projeler.durum', 'İptal').eq('projeler.silindi_mi', false),
        supabase.from('hatalar').select('id, proje:projeler!inner(durum, silindi_mi)', { count: 'exact', head: true })
          .in('durum', ['Açık', 'Düzeltiliyor']).lt('son_tarih', new Date().toISOString())
          .neq('projeler.durum', 'İptal').eq('projeler.silindi_mi', false),
        supabase.from('projeler').select('id', { count: 'exact', head: true }).lt('hedef_teslim_tarihi', new Date().toISOString().split('T')[0]).eq('aktif_mi', true),
      ])

      const buAyBaslangic = new Date()
      buAyBaslangic.setDate(1); buAyBaslangic.setHours(0, 0, 0, 0)
      const { count: buAyBlok } = await supabase
        .from('blok_asamalari').select('id', { count: 'exact', head: true })
        .eq('asama_tipi', 'Devreye Alma').eq('durum', 'Tamamlandı').eq('sonuc', 'Uygun')
        .gte('kontrol_tarihi', buAyBaslangic.toISOString())

      return {
        aktifProje: aktif.count ?? 0,
        tamamlananProje: tamamlanan.count ?? 0,
        acikHata: acikHata.count ?? 0,
        sureciHata: sureciHata.count ?? 0,
        buAyDevreAlinan: buAyBlok ?? 0,
        gecikmisPrje: gecikmisPrj.count ?? 0,
      }
    },
  })
}

// ─── Aktivite logu ────────────────────────────────────────────
export function useAktiviteLogu(projeId?: string, limit = 15) {
  return useQuery({
    queryKey: ['aktivite', projeId, limit],
    queryFn: async () => {
      let q = supabase.from('aktivite_logu').select(`
        *, kullanici:kullanicilar(id, ad_soyad)
      `).order('tarih', { ascending: false }).limit(limit)
      if (projeId) q = q.eq('proje_id', projeId)
      const { data, error } = await q
      if (error) return []
      return data ?? []
    },
  })
}

// ─── Bildirimler ──────────────────────────────────────────────
export function useBildirimler() {
  const { kullanici } = useAuth()
  return useQuery({
    queryKey: ['bildirimler', kullanici?.id],
    enabled: !!kullanici,
    queryFn: async () => {
      const { data, error } = await supabase.from('bildirimler')
        .select('*').eq('kullanici_id', kullanici!.id)
        .order('olusturma_tarihi', { ascending: false }).limit(20)
      if (error) return []
      return data ?? []
    },
  })
}

// ─── Materialized view (panel ve liste için hızlı özet) ───────
export function useMvProjeOzet(filters?: {
  durum?: string
  il?: string
  satis_temsilcisi_id?: string
}) {
  return useQuery({
    queryKey: ['mv-proje-ozet', filters],
    queryFn: async () => {
      let q = supabase.from('mv_proje_ozet').select('*')
        .neq('durum', 'İptal')  // Silinen/arşivlenen projeler varsayılan görünmez
        .order('son_hareket_tarihi', { ascending: false })
      if (filters?.durum) q = q.eq('durum', filters.durum)
      if (filters?.il) q = q.eq('il', filters.il)
      if (filters?.satis_temsilcisi_id) q = q.eq('satis_temsilcisi_id', filters.satis_temsilcisi_id)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

// ─── Aylık blok grafiği verisi ────────────────────────────────
export function useAylikBlokVerisi() {
  return useQuery({
    queryKey: ['aylik-blok'],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blok_asamalari')
        .select('kontrol_tarihi')
        .eq('asama_tipi', 'Devreye Alma')
        .eq('durum', 'Tamamlandı')
        .eq('sonuc', 'Uygun')
        .gte('kontrol_tarihi', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('kontrol_tarihi', { ascending: true })
      if (error) throw error

      // Son 12 ayı oluştur
      const aylar: { ay: string; sayi: number; kumulatif: number }[] = []
      const simdi = new Date()
      let kumulatif = 0
      for (let i = 11; i >= 0; i--) {
        const tarih = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1)
        const ayAdi = tarih.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
        const sayi = (data ?? []).filter(d => {
          if (!d.kontrol_tarihi) return false
          const t = new Date(d.kontrol_tarihi)
          return t.getFullYear() === tarih.getFullYear() && t.getMonth() === tarih.getMonth()
        }).length
        kumulatif += sayi
        aylar.push({ ay: ayAdi, sayi, kumulatif })
      }
      return aylar
    },
  })
}

// ─── V1 uyumluluk aliasları ───────────────────────────────────
export const useUpdateAshama = useUpdateAsama
// useArchiveProject artık yukarıda tam implementasyonla tanımlı
