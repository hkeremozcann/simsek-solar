import { Check, X, Circle, Pause, Clock, AlertTriangle, MinusCircle } from 'lucide-react'
import type { AsamaDurumu, AsamaSonucu, ProjeDurumu, HataDurumu, HataSiddeti } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary' | 'critical'
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const styles: Record<string, string> = {
    success:  'bg-green-50 text-[#1B7A4B] border border-[#1B7A4B]/30',
    error:    'bg-red-50 text-[#B3261E] border border-l-4 border-[#B3261E]/30 border-l-[#B3261E]',
    warning:  'bg-amber-50 text-[#9A6700] border border-[#9A6700]/30',
    info:     'bg-[#1B4B73]/10 text-[#1B4B73] border border-[#1B4B73]/20',
    neutral:  'bg-[#F5F7F9] text-[#6B7785] border border-[#D6DCE3]',
    primary:  'bg-[#B4531F]/10 text-[#B4531F] border border-[#B4531F]/20',
    critical: 'bg-[#7A1512]/10 text-[#7A1512] border border-[#7A1512]/30',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
      styles[variant], className
    )}>
      {children}
    </span>
  )
}

// Blok aşama durumu rozeti — renk + ikon + metin (WCAG: renk tek başına anlam taşımaz)
export function AsamaBadge({ durum, sonuc }: { durum: AsamaDurumu; sonuc?: AsamaSonucu | null }) {
  if (durum === 'Tamamlandı' && sonuc === 'Uygun') {
    return (
      <Badge variant="success">
        <Check size={11} aria-hidden />
        <span>Uygun</span>
      </Badge>
    )
  }
  if (durum === 'Tamamlandı' && sonuc === 'Hatalı') {
    return (
      <Badge variant="error">
        <X size={11} aria-hidden />
        <span>Hatalı</span>
      </Badge>
    )
  }
  if (durum === 'Devam Ediyor') {
    return (
      <Badge variant="primary">
        <Circle size={11} className="fill-current" aria-hidden />
        <span>Devam</span>
      </Badge>
    )
  }
  return (
    <Badge variant="neutral">
      <Circle size={11} aria-hidden />
      <span>Başlamadı</span>
    </Badge>
  )
}

export function ProjeDurumBadge({ durum, gecikmisMi, hareketsizMi }: {
  durum: ProjeDurumu
  gecikmisMi?: boolean
  hareketsizMi?: boolean
}) {
  const map: Record<ProjeDurumu, { variant: BadgeProps['variant']; ikon: React.ReactNode; label: string }> = {
    'Çalışıyor':  { variant: 'primary', ikon: <Circle size={10} className="fill-current" aria-hidden />, label: 'Çalışıyor' },
    'Beklemede':  { variant: 'neutral', ikon: <Pause size={10} aria-hidden />, label: 'Beklemede' },
    'Tamamlandı': { variant: 'success', ikon: <Check size={10} aria-hidden />, label: 'Tamamlandı' },
    'İptal':      { variant: 'error', ikon: <X size={10} aria-hidden />, label: 'İptal' },
  }
  const { variant, ikon, label } = map[durum]
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Badge variant={variant}>
        {ikon}
        <span>{label}</span>
      </Badge>
      {gecikmisMi && (
        <Badge variant="warning">
          <Clock size={10} aria-hidden />
          <span>Gecikmiş</span>
        </Badge>
      )}
      {hareketsizMi && !gecikmisMi && (
        <Badge variant="neutral">
          <MinusCircle size={10} aria-hidden />
          <span>Hareketsiz</span>
        </Badge>
      )}
    </div>
  )
}

export function HataSiddetBadge({ siddet }: { siddet: HataSiddeti }) {
  const map: Record<HataSiddeti, { variant: BadgeProps['variant']; label: string }> = {
    'Kritik': { variant: 'critical', label: 'Kritik' },
    'Majör':  { variant: 'error', label: 'Majör' },
    'Minör':  { variant: 'warning', label: 'Minör' },
  }
  const { variant, label } = map[siddet]
  return (
    <Badge variant={variant}>
      <AlertTriangle size={10} aria-hidden />
      <span>{label}</span>
    </Badge>
  )
}

export function HataDurumBadge({ durum }: { durum: HataDurumu }) {
  const map: Record<HataDurumu, { variant: BadgeProps['variant'] }> = {
    'Açık':              { variant: 'error' },
    'Düzeltiliyor':      { variant: 'warning' },
    'Yeniden Kontrolde': { variant: 'info' },
    'Kapandı':           { variant: 'success' },
    'Kabul Edildi':      { variant: 'neutral' },
  }
  return <Badge variant={map[durum].variant}>{durum}</Badge>
}
