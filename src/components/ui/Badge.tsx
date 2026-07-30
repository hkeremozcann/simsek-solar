import type { AsamaDurumu, AsamaSonucu, ProjeDurumu } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary'
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const styles = {
    success: 'bg-green-100 text-[#1B7A4B] border border-[#1B7A4B]/30',
    error: 'bg-red-100 text-[#B3261E] border border-[#B3261E]/30 border-l-4 border-l-[#B3261E]',
    warning: 'bg-amber-50 text-[#9A6700] border border-[#9A6700]/30',
    info: 'bg-[#1B4B73]/10 text-[#1B4B73] border border-[#1B4B73]/20',
    neutral: 'bg-gray-100 text-[#6B7785] border border-[#D6DCE3]',
    primary: 'bg-[#B4531F]/10 text-[#B4531F] border border-[#B4531F]/20',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function AsamaBadge({
  durum,
  sonuc,
}: {
  durum: AsamaDurumu
  sonuc?: AsamaSonucu | null
}) {
  if (durum === 'Tamamlandı' && sonuc === 'Uygun') {
    return (
      <Badge variant="success">
        <span aria-hidden>✓</span>
        <span>Uygun</span>
      </Badge>
    )
  }
  if (durum === 'Tamamlandı' && sonuc === 'Hatalı') {
    return (
      <Badge variant="error">
        <span aria-hidden>✕</span>
        <span>Hatalı</span>
      </Badge>
    )
  }
  if (durum === 'Devam Ediyor') {
    return (
      <Badge variant="primary">
        <span aria-hidden>◐</span>
        <span>Devam Ediyor</span>
      </Badge>
    )
  }
  return (
    <Badge variant="neutral">
      <span aria-hidden>○</span>
      <span>Başlamadı</span>
    </Badge>
  )
}

export function ProjeDurumBadge({ durum }: { durum: ProjeDurumu }) {
  const map: Record<ProjeDurumu, { variant: BadgeProps['variant']; icon: string }> = {
    'Çalışıyor': { variant: 'primary', icon: '●' },
    'Beklemede': { variant: 'neutral', icon: '⏸' },
    'Tamamlandı': { variant: 'success', icon: '✓' },
    'İptal': { variant: 'error', icon: '✕' },
  }
  const { variant, icon } = map[durum]
  return (
    <Badge variant={variant}>
      <span aria-hidden>{icon}</span>
      <span>{durum}</span>
    </Badge>
  )
}
