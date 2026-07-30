import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  leftIcon, rightIcon, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed'

  const variants: Record<string, string> = {
    primary:   'bg-[#B4531F] text-white hover:bg-[#8f3f14] focus-visible:outline-[#B4531F] disabled:opacity-50',
    secondary: 'bg-[#1B4B73] text-white hover:bg-[#133858] focus-visible:outline-[#1B4B73] disabled:opacity-50',
    danger:    'bg-[#B3261E] text-white hover:bg-[#8a1c16] focus-visible:outline-[#B3261E] disabled:opacity-50',
    ghost:     'bg-transparent text-[#0F1F33] hover:bg-[#D6DCE3]/60 focus-visible:outline-[#B4531F] disabled:opacity-40',
    outline:   'bg-white text-[#0F1F33] border border-[#D6DCE3] hover:bg-[#F5F7F9] focus-visible:outline-[#B4531F] disabled:opacity-40',
  }

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[52px]',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <Loader2 size={16} className="animate-spin" aria-hidden />
        : leftIcon
      }
      {children}
      {!loading && rightIcon}
    </button>
  )
}
