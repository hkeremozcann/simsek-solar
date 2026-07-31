import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Clock, Check, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, Input } from '@/components/ui/FormField'
import { TableSkeleton, HataDurumu, BosDurum } from '@/components/common/QueryState'
import { formatTarih, formatGoreceli } from '@/lib/utils'
import type { Hata } from '@/lib/types'

export default function HatalarListesi() {
  const navigate = useNavigate()
  const { rolKontrol } = useAuth()
  const queryClient = useQueryClient()
  const yazabilir = rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu'])

  const [durumFiltre, setDurumFiltre] = useState('')
  const [siddetFiltre, setSiddetFiltre] = useState('')
  const [arama, setArama] = useState('')
  const [kapaniyor, setKapaniyor] = useState<string | null>(null)

  const { data: hatalar = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tum-hatalar', durumFiltre, siddetFiltre],
    queryFn: async () => {
      let q = supabase.from('hatalar').select(`
        *,
        tespit_eden:kullanicilar!tespit_eden_id(id, ad_soyad),
        atanan:kullanicilar!atanan_id(id, ad_soyad),
        proje:projeler!proje_id(proje_kodu, proje_adi)
      `).order('tespit_tarihi', { ascending: false })

      if (durumFiltre) q = q.eq('durum', durumFiltre)
      if (siddetFiltre) q = q.eq('siddet', siddetFiltre)

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as (Hata & { proje?: { proje_kodu: string; proje_adi: string } })[]
    },
  })

  const filtreli = hatalar.filter(h =>
    !arama || h.aciklama.toLowerCase().includes(arama.toLowerCase())
      || h.hata_kodu.toLowerCase().includes(arama.toLowerCase())
      || h.kategori.toLowerCase().includes(arama.toLowerCase())
  )

  const acikSayisi = hatalar.filter(h => ['Açık', 'Düzeltiliyor', 'Yeniden Kontrolde'].includes(h.durum)).length
  const sureciGecmis = hatalar.filter(h =>
    h.son_tarih && new Date(h.son_tarih) < new Date() &&
    !['Kapandı', 'Kabul Edildi'].includes(h.durum)
  ).length

  async function kapat(hataId: string) {
    setKapaniyor(hataId)
    await supabase.from('hatalar').update({
      durum: 'Kapandı',
      kapanma_tarihi: new Date().toISOString(),
    }).eq('id', hataId)
    queryClient.invalidateQueries({ queryKey: ['tum-hatalar'] })
    queryClient.invalidateQueries({ queryKey: ['mv-proje-ozet'] })
    setKapaniyor(null)
  }

  const SIDDET_RENK: Record<string, 'error' | 'warning' | 'neutral'> = {
    Kritik: 'error', Majör: 'warning', Minör: 'neutral',
  }
  const DURUM_RENK: Record<string, 'error' | 'warning' | 'info' | 'success' | 'neutral'> = {
    'Açık': 'error', 'Düzeltiliyor': 'warning', 'Yeniden Kontrolde': 'info',
    'Kapandı': 'success', 'Kabul Edildi': 'neutral',
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Hatalar"
        aciklama={`${acikSayisi} açık · ${sureciGecmis > 0 ? `${sureciGecmis} süresi geçmiş` : ''}`}
      />

      {/* Filtreler */}
      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-2.5">
        <div className="flex flex-wrap gap-2 items-center">
          <Input value={arama} onChange={e => setArama(e.target.value)}
            placeholder="Hata kodu, kategori, açıklama…" className="h-9 text-sm min-w-48 flex-1 max-w-64"
            aria-label="Hata ara" />
          <Select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value)}
            className="h-9 text-sm w-40" aria-label="Durum filtresi">
            <option value="">Tüm durumlar</option>
            <option>Açık</option><option>Düzeltiliyor</option>
            <option>Yeniden Kontrolde</option><option>Kapandı</option><option>Kabul Edildi</option>
          </Select>
          <Select value={siddetFiltre} onChange={e => setSiddetFiltre(e.target.value)}
            className="h-9 text-sm w-32" aria-label="Şiddet filtresi">
            <option value="">Tüm şiddetler</option>
            <option>Kritik</option><option>Majör</option><option>Minör</option>
          </Select>
          {(durumFiltre || siddetFiltre || arama) && (
            <button onClick={() => { setDurumFiltre(''); setSiddetFiltre(''); setArama('') }}
              className="text-xs text-[#6B7785] hover:text-[#B3261E] min-h-[36px] px-2">
              Temizle
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {isLoading ? <TableSkeleton satirSayisi={6} sutunSayisi={5} /> :
         error ? <HataDurumu hata={error as Error} tekrarDene={refetch} /> :
         filtreli.length === 0 ? (
           <BosDurum baslik="Hata kaydı yok"
             aciklama={arama || durumFiltre ? 'Filtrelerle eşleşen hata bulunamadı.' : 'Projede hata kaydı oluşturulmamış.'} />
         ) : (
          <div className="space-y-2">
            {filtreli.map(h => {
              const gecmis = h.son_tarih && new Date(h.son_tarih) < new Date() &&
                !['Kapandı', 'Kabul Edildi'].includes(h.durum)
              return (
                <Card key={h.id} className={gecmis ? 'border-l-4 border-l-[#7A1512]' : ''}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#B3261E]"
                          style={{ fontFamily: 'IBM Plex Mono' }}>{h.hata_kodu}</span>
                        <Badge variant={SIDDET_RENK[h.siddet] || 'neutral'}>{h.siddet}</Badge>
                        <Badge variant={DURUM_RENK[h.durum] || 'neutral'}>{h.durum}</Badge>
                        {gecmis && (
                          <Badge variant="error">
                            <Clock size={9} aria-hidden /> Süresi geçmiş
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[#0F1F33] mt-1">{h.kategori}</p>
                      <p className="text-sm text-[#6B7785] mt-0.5 line-clamp-2">{h.aciklama}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {h.proje && (
                          <button
                            onClick={() => navigate(`/projeler/${h.proje_id}`)}
                            className="text-xs text-[#1B4B73] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={10} aria-hidden />
                            {h.proje.proje_kodu}
                          </button>
                        )}
                        <span className="text-xs text-[#6B7785] font-mono"
                          style={{ fontFamily: 'IBM Plex Mono' }}>
                          {formatTarih(h.tespit_tarihi)}
                        </span>
                        {h.son_tarih && (
                          <span className={`text-xs font-mono ${gecmis ? 'text-[#B3261E] font-semibold' : 'text-[#6B7785]'}`}
                            style={{ fontFamily: 'IBM Plex Mono' }}>
                            Son: {formatTarih(h.son_tarih)}
                          </span>
                        )}
                        {h.sorumlu_taraf && (
                          <span className="text-xs text-[#6B7785]">{h.sorumlu_taraf}</span>
                        )}
                      </div>
                    </div>
                    {yazabilir && !['Kapandı', 'Kabul Edildi'].includes(h.durum) && (
                      <Button size="sm" variant="outline"
                        leftIcon={<Check size={13} />}
                        loading={kapaniyor === h.id}
                        onClick={() => kapat(h.id)}>
                        Kapat
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
         )}
      </div>
    </div>
  )
}
