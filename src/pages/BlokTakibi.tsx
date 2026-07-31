import { useNavigate } from 'react-router-dom'
import { useMvProjeOzet } from '@/hooks/useProjects'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardSkeleton, HataDurumu, BosDurum } from '@/components/common/QueryState'
import { ASAMA_SIRALAMA, ASAMA_KISA } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function BlokTakibi() {
  const navigate = useNavigate()
  const { data: projeler = [], isLoading, error, refetch } = useMvProjeOzet()

  const aktifProjeler = projeler
    .filter(p => p.aktif_mi || p.saha_yuzdesi > 0)
    .sort((a, b) => b.saha_yuzdesi - a.saha_yuzdesi)

  const asamaRenk = (pct: number) => {
    if (pct === 0) return 'bg-[#F5F7F9] text-[#D6DCE3]'
    if (pct === 100) return 'bg-[#1B7A4B]/20 text-[#1B7A4B] font-semibold'
    if (pct >= 75) return 'bg-[#1B7A4B]/10 text-[#1B7A4B]'
    if (pct >= 50) return 'bg-[#B4531F]/10 text-[#B4531F]'
    if (pct >= 25) return 'bg-[#9A6700]/10 text-[#9A6700]'
    return 'bg-[#B3261E]/5 text-[#6B7785]'
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PageHeader baslik="Blok Takibi"
        aciklama="Tüm aktif projelerin aşama ısı haritası — renk koyu = daha ileri" />

      <div className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-2">
        <div className="flex items-center gap-3 text-xs text-[#6B7785]">
          {[['#F5F7F9','%0'],['#B3261E','1-24%'],['#9A6700','25-49%'],['#B4531F','50-74%'],['#1B7A4B','75-99%'],['#1B7A4B','100%']].map(([renk, etiket]) => (
            <div key={etiket} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-[#D6DCE3]" style={{ backgroundColor: renk + '30' }} />
              {etiket}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {isLoading ? <CardSkeleton sayi={4} /> :
         error ? <HataDurumu hata={error as Error} tekrarDene={refetch} /> :
         aktifProjeler.length === 0 ? <BosDurum baslik="Aktif proje yok" /> : (
          <div className="table-scroll">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#D6DCE3]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7785] uppercase tracking-wide min-w-[180px] sticky left-0 bg-white z-10">Proje</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-[#6B7785] uppercase w-12">Blok</th>
                  {ASAMA_SIRALAMA.map(a => (
                    <th key={a} className="px-2 py-2 text-center text-xs font-semibold text-[#6B7785] uppercase min-w-[80px]">
                      {ASAMA_KISA[a]}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center text-xs font-semibold text-[#6B7785] uppercase w-16">Genel</th>
                </tr>
              </thead>
              <tbody>
                {aktifProjeler.map(p => {
                  const asamalar = [
                    p.kaide_tamamlanan ?? 0,
                    p.dizilim_tamamlanan ?? 0,
                    p.borulama_tamamlanan ?? 0,
                    p.pano_tamamlanan ?? 0,
                    p.devreye_alinan_blok ?? 0,
                  ]
                  return (
                    <tr key={p.id}
                      className="border-b border-[#D6DCE3] hover:bg-[#F5F7F9] cursor-pointer"
                      onClick={() => navigate(`/projeler/${p.id}`)}>
                      <td className="px-3 py-2 sticky left-0 bg-white z-10">
                        <span className="text-xs font-mono text-[#1B4B73]" style={{ fontFamily: 'IBM Plex Mono' }}>
                          {p.proje_kodu}
                        </span>
                        <p className="text-sm font-medium truncate max-w-44">{p.proje_adi}</p>
                      </td>
                      <td className="px-2 py-2 text-center font-mono text-xs" style={{ fontFamily: 'IBM Plex Mono' }}>
                        {p.blok_sayisi}
                      </td>
                      {asamalar.map((tam, i) => {
                        const pct = p.blok_sayisi > 0 ? Math.floor((tam / p.blok_sayisi) * 100) : 0
                        return (
                          <td key={i} className="px-1 py-1.5 text-center">
                            <div className={cn('rounded px-1.5 py-1 text-xs font-mono mx-0.5', asamaRenk(pct))}
                              style={{ fontFamily: 'IBM Plex Mono' }}
                              title={`${tam}/${p.blok_sayisi} · %${pct}`}>
                              {tam}/{p.blok_sayisi}
                            </div>
                          </td>
                        )
                      })}
                      <td className="px-2 py-1.5 text-center">
                        <div className={cn('rounded px-2 py-1 text-xs font-mono font-bold inline-block', asamaRenk(p.saha_yuzdesi))}
                          style={{ fontFamily: 'IBM Plex Mono' }}>
                          %{p.saha_yuzdesi}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
         )}
      </div>
    </div>
  )
}
