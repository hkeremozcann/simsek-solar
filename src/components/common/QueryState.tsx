import { AlertCircle, RefreshCw, Inbox, Plus } from 'lucide-react'

interface LoadingProps {
  satirSayisi?: number
  sutunSayisi?: number
}

export function TableSkeleton({ satirSayisi = 5, sutunSayisi = 5 }: LoadingProps) {
  return (
    <div role="status" aria-label="Yükleniyor" aria-live="polite">
      <div className="animate-pulse">
        {Array.from({ length: satirSayisi }).map((_, i) => (
          <div key={i} className="flex gap-3 px-3 py-3 border-b border-[#D6DCE3]">
            {Array.from({ length: sutunSayisi }).map((_, j) => (
              <div key={j} className="skeleton h-4 flex-1 rounded" style={{ opacity: 1 - j * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Veriler yükleniyor…</span>
    </div>
  )
}

export function CardSkeleton({ sayi = 3 }: { sayi?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="status" aria-label="Yükleniyor">
      {Array.from({ length: sayi }).map((_, i) => (
        <div key={i} className="bg-white border border-[#D6DCE3] rounded p-4 space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-16 rounded" />
        </div>
      ))}
      <span className="sr-only">Yükleniyor…</span>
    </div>
  )
}

interface HataDurumuProps {
  hata: Error | null
  tekrarDene: () => void
  mesaj?: string
}

export function HataDurumu({ hata, tekrarDene, mesaj }: HataDurumuProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="text-[#B3261E] mb-3" size={40} aria-hidden />
      <h3
        className="text-base font-semibold text-[#0F1F33] mb-1"
        style={{ fontFamily: 'Archivo, sans-serif' }}
      >
        {mesaj || 'Veriler yüklenemedi'}
      </h3>
      <p className="text-sm text-[#6B7785] mb-4 max-w-sm">
        Ağ bağlantınızı kontrol edip tekrar deneyin.
      </p>
      <button
        onClick={tekrarDene}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#B4531F] text-white text-sm rounded hover:bg-[#8f3f14] transition-colors min-h-[44px]"
      >
        <RefreshCw size={16} aria-hidden />
        Tekrar dene
      </button>
      {hata && (
        <details className="mt-4 text-left max-w-sm">
          <summary className="text-xs text-[#6B7785] cursor-pointer hover:text-[#0F1F33]">
            Teknik detaylar
          </summary>
          <pre className="mt-2 text-xs bg-[#F5F7F9] border border-[#D6DCE3] rounded p-3 overflow-auto">
            {hata.message}
          </pre>
        </details>
      )}
    </div>
  )
}

interface BosProps {
  baslik: string
  aciklama?: string
  eylem?: React.ReactNode
  ikon?: React.ReactNode
}

export function BosDurum({ baslik, aciklama, eylem, ikon }: BosProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-[#D6DCE3] mb-4" aria-hidden>
        {ikon || <Inbox size={48} />}
      </div>
      <h3
        className="text-base font-semibold text-[#0F1F33] mb-2"
        style={{ fontFamily: 'Archivo, sans-serif' }}
      >
        {baslik}
      </h3>
      {aciklama && (
        <p className="text-sm text-[#6B7785] mb-6 max-w-sm">{aciklama}</p>
      )}
      {eylem}
    </div>
  )
}

// Tip-güvenli 4-durumlu render yardımcısı
interface QueryStateProps<T> {
  isLoading: boolean
  error: Error | null
  data: T | undefined | null
  refetch: () => void
  isEmpty?: (data: T) => boolean
  loadingComponent?: React.ReactNode
  errorMesaj?: string
  bosBaslik?: string
  bosAciklama?: string
  bosEylem?: React.ReactNode
  children: (data: T) => React.ReactNode
}

export function QueryState<T>({
  isLoading, error, data, refetch,
  isEmpty = (d) => Array.isArray(d) ? (d as unknown[]).length === 0 : !d,
  loadingComponent,
  errorMesaj,
  bosBaslik = 'Kayıt bulunamadı',
  bosAciklama,
  bosEylem,
  children,
}: QueryStateProps<T>) {
  if (isLoading) {
    return <>{loadingComponent || <TableSkeleton />}</>
  }

  if (error) {
    return <HataDurumu hata={error} tekrarDene={refetch} mesaj={errorMesaj} />
  }

  if (!data || isEmpty(data)) {
    return (
      <BosDurum
        baslik={bosBaslik}
        aciklama={bosAciklama}
        eylem={bosEylem}
      />
    )
  }

  return <>{children(data)}</>
}
