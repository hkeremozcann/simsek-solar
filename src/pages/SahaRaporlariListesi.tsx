import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, ExternalLink, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/FormField'
import { TableSkeleton, HataDurumu, BosDurum } from '@/components/common/QueryState'
import { formatTarih } from '@/lib/utils'
import { useState } from 'react'

export default function SahaRaporlariListesi() {
  const navigate = useNavigate()
  const [tipFiltre, setTipFiltre] = useState('')

  const { data: raporlar = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tum-saha-raporlari', tipFiltre],
    staleTime: 0,
    queryFn: async () => {
      let q = supabase.from('saha_raporlari').select(`
        *,
        hazirlayan:kullanicilar!hazirlayan_id(id, ad_soyad),
        proje:projeler!proje_id(proje_kodu, proje_adi, il, durum, silindi_mi)
      `).order('rapor_tarihi', { ascending: false })

      if (tipFiltre) q = q.eq('rapor_tipi', tipFiltre)

      const { data, error } = await q
      if (error) throw error

      // Sadece aktif projelerin raporlarını göster
      return (data ?? []).filter((r: { proje?: { durum?: string; silindi_mi?: boolean } }) =>
        r.proje?.durum !== 'İptal' && r.proje?.silindi_mi === false
      )
    },
  })

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Saha Raporları"
        aciklama={`${raporlar.length} rapor · ${raporlar.filter((r: { gonderildi_mi: boolean }) => r.gonderildi_mi).length} gönderildi`}
      />

      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-2.5">
        <Select value={tipFiltre} onChange={e => setTipFiltre(e.target.value)}
          className="h-9 text-sm w-44">
          <option value="">Tüm tipler</option>
          {['İlk Keşif','Ara Kontrol','Kaide Kontrol','Montaj Kontrol',
            'Devreye Alma','Arıza/Servis','Kesin Teslim'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>

      <div className="p-4 md:p-6">
        {isLoading ? <TableSkeleton satirSayisi={6} sutunSayisi={4} /> :
         error ? <HataDurumu hata={error as Error} tekrarDene={refetch} /> :
         raporlar.length === 0 ? (
           <BosDurum baslik="Saha raporu bulunamadı" />
         ) : (
          <div className="space-y-2">
            {raporlar.map((r: {
              id: string; rapor_no: string; rapor_tipi: string; rapor_tarihi: string
              ozet: string; gonderildi_mi: boolean; gonderim_durumu?: string
              proje_id: string
              hazirlayan?: { ad_soyad: string } | null
              proje?: { proje_kodu: string; proje_adi: string; il: string } | null
            }) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#1B4B73]"
                        style={{ fontFamily: 'IBM Plex Mono' }}>{r.rapor_no}</span>
                      <Badge variant="info">{r.rapor_tipi}</Badge>
                      <Badge variant={r.gonderildi_mi ? 'success' : 'neutral'}>
                        {r.gonderildi_mi
                          ? <><Check size={9} aria-hidden /> Gönderildi</>
                          : 'Taslak'
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-[#0F1F33] mt-1 line-clamp-2">{r.ozet}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {r.proje && (
                        <button onClick={() => navigate(`/projeler/${r.proje_id}`)}
                          className="text-xs text-[#1B4B73] hover:underline flex items-center gap-1">
                          <ExternalLink size={10} aria-hidden />
                          {r.proje.proje_kodu} · {r.proje.il}
                        </button>
                      )}
                      <span className="text-xs text-[#6B7785] font-mono"
                        style={{ fontFamily: 'IBM Plex Mono' }}>
                        {formatTarih(r.rapor_tarihi)}
                      </span>
                      {r.hazirlayan && (
                        <span className="text-xs text-[#6B7785]">{r.hazirlayan.ad_soyad}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
         )}
      </div>
    </div>
  )
}
