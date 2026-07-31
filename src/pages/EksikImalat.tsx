import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, AlertTriangle } from 'lucide-react'
import { useEksikImalatlar } from '@/hooks/useProjects'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/FormField'
import { TableSkeleton, HataDurumu, BosDurum } from '@/components/common/QueryState'
import { formatTarih } from '@/lib/utils'
import type { EksikImalat } from '@/lib/types'

export default function EksikImalatListesi() {
  const navigate = useNavigate()
  const { rolKontrol } = useAuth()
  const queryClient = useQueryClient()
  const yazabilir = rolKontrol(['yonetici', 'satis_sonrasi_sorumlusu'])
  const [durumFiltre, setDurumFiltre] = useState('')
  const [guncelleniyor, setGuncelleniyor] = useState<string | null>(null)

  const { data: imalatlar = [], isLoading, error, refetch } = useEksikImalatlar()

  const filtreli = imalatlar.filter(i => !durumFiltre || i.durum === durumFiltre)
  const engelleyici = filtreli.filter(i => i.engelleyici_mi && i.durum !== 'Tamamlandı')
  const diger = filtreli.filter(i => !i.engelleyici_mi || i.durum === 'Tamamlandı')

  async function durumGuncelle(id: string, yeniDurum: string) {
    setGuncelleniyor(id)
    await supabase.from('eksik_imalatlar').update({ durum: yeniDurum }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['eksik-imalatlar'] })
    setGuncelleniyor(null)
  }

  const DURUM_RENK: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
    'Açık': 'error', 'Sipariş Verildi': 'warning',
    'Sahaya Sevk Edildi': 'info', 'Tamamlandı': 'success',
  }

  const EksikKarti = ({ i }: { i: EksikImalat }) => (
    <Card key={i.id} className={i.engelleyici_mi && i.durum !== 'Tamamlandı' ? 'border-l-4 border-l-[#B3261E]' : ''}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {i.engelleyici_mi && i.durum !== 'Tamamlandı' && (
              <Badge variant="error"><AlertTriangle size={10} aria-hidden /> Engelleyici</Badge>
            )}
            <Badge variant={DURUM_RENK[i.durum] || 'neutral'}>{i.durum}</Badge>
          </div>
          <p className="text-sm font-medium text-[#0F1F33] mt-1">{i.kalem}</p>
          {i.asama_tipi && <p className="text-xs text-[#6B7785]">{i.asama_tipi}</p>}
          <div className="flex gap-3 mt-1 flex-wrap">
            <span className="text-xs font-mono text-[#0F1F33]" style={{ fontFamily: 'IBM Plex Mono' }}>
              Mevcut: <strong>{i.mevcut_adet}</strong> / Planlanan: <strong>{i.planlanan_adet}</strong>
              {' '}· Eksik: <strong className="text-[#B3261E]">{i.planlanan_adet - i.mevcut_adet}</strong>
            </span>
            {i.tahmini_kapanma_tarihi && (
              <span className="text-xs text-[#6B7785] font-mono" style={{ fontFamily: 'IBM Plex Mono' }}>
                Hedef: {formatTarih(i.tahmini_kapanma_tarihi)}
              </span>
            )}
          </div>
        </div>
        {yazabilir && i.durum !== 'Tamamlandı' && (
          <Select value={i.durum}
            onChange={e => durumGuncelle(i.id, e.target.value)}
            className="h-8 text-xs w-40"
            aria-label={`${i.kalem} durumu`}>
            <option>Açık</option>
            <option>Sipariş Verildi</option>
            <option>Sahaya Sevk Edildi</option>
            <option>Tamamlandı</option>
          </Select>
        )}
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader
        baslik="Eksik İmalat"
        aciklama={`${engelleyici.length} engelleyici · ${filtreli.filter(i => i.durum !== 'Tamamlandı').length} açık`}
      />

      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-2.5">
        <div className="flex gap-2">
          <Select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value)}
            className="h-9 text-sm w-44">
            <option value="">Tüm durumlar</option>
            <option>Açık</option><option>Sipariş Verildi</option>
            <option>Sahaya Sevk Edildi</option><option>Tamamlandı</option>
          </Select>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {isLoading ? <TableSkeleton satirSayisi={5} sutunSayisi={3} /> :
         error ? <HataDurumu hata={error as Error} tekrarDene={refetch} /> :
         filtreli.length === 0 ? (
           <BosDurum baslik="Eksik imalat kaydı yok" />
         ) : (
          <>
            {engelleyici.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#B3261E] uppercase tracking-wide mb-2">
                  Engelleyici ({engelleyici.length})
                </p>
                <div className="space-y-2">
                  {engelleyici.map(i => <EksikKarti key={i.id} i={i} />)}
                </div>
              </div>
            )}
            {diger.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7785] uppercase tracking-wide mb-2">
                  Diğer ({diger.length})
                </p>
                <div className="space-y-2">
                  {diger.map(i => <EksikKarti key={i.id} i={i} />)}
                </div>
              </div>
            )}
          </>
         )}
      </div>
    </div>
  )
}
