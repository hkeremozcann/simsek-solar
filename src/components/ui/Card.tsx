import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return (
    <div
      className={cn(
        'bg-white border border-[#D6DCE3] rounded',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-[#0F1F33]" style={{ fontFamily: 'Archivo, sans-serif' }}>
          {title}
        </h3>
        {subtitle && <p className="text-sm text-[#6B7785] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

interface StatCardProps {
  baslik: string
  deger: string | number
  ikon?: React.ReactNode
  renk?: 'default' | 'success' | 'error' | 'warning' | 'info'
  alt?: string
}

export function StatCard({ baslik, deger, ikon, renk = 'default', alt }: StatCardProps) {
  const renkler = {
    default: 'border-[#D6DCE3]',
    success: 'border-l-4 border-[#1B7A4B]',
    error: 'border-l-4 border-[#B3261E]',
    warning: 'border-l-4 border-[#9A6700]',
    info: 'border-l-4 border-[#1B4B73]',
  }
  return (
    <div className={cn('bg-white border border-[#D6DCE3] rounded p-4', renkler[renk])}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-[#6B7785] font-medium">{baslik}</p>
          <p className="text-2xl font-bold text-[#0F1F33] mt-1 tabular-nums" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {deger}
          </p>
          {alt && <p className="text-xs text-[#6B7785] mt-1">{alt}</p>}
        </div>
        {ikon && (
          <div className="text-[#6B7785] flex-shrink-0 mt-0.5" aria-hidden>
            {ikon}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  yuzdesi: number
  renk?: string
  label?: string
  showLabel?: boolean
}

export function ProgressBar({ yuzdesi, renk = '#1B7A4B', label, showLabel = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, yuzdesi))
  return (
    <div>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-[#6B7785]">{label}</span>}
          {showLabel && (
            <span className="text-xs font-mono font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              %{pct}
            </span>
          )}
        </div>
      )}
      <div
        className="h-2 bg-[#D6DCE3] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: renk }}
        />
      </div>
    </div>
  )
}

export function EmptyState({
  baslik,
  aciklama,
  eylem,
}: {
  baslik: string
  aciklama?: string
  eylem?: React.ReactNode
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-4xl mb-4 text-[#D6DCE3]" aria-hidden>⬡</div>
      <h3 className="text-base font-semibold text-[#0F1F33] mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
        {baslik}
      </h3>
      {aciklama && <p className="text-sm text-[#6B7785] mb-6 max-w-sm mx-auto">{aciklama}</p>}
      {eylem}
    </div>
  )
}
