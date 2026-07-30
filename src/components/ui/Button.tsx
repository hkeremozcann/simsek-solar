import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2'

  const variants = {
    primary: 'bg-[#B4531F] text-white hover:bg-[#8f3f14] focus-visible:outline-[#B4531F] disabled:bg-[#B4531F]/40',
    secondary: 'bg-[#1B4B73] text-white hover:bg-[#133858] focus-visible:outline-[#1B4B73] disabled:bg-[#1B4B73]/40',
    danger: 'bg-[#B3261E] text-white hover:bg-[#8a1c16] focus-visible:outline-[#B3261E] disabled:bg-[#B3261E]/40',
    ghost: 'bg-transparent text-[#0F1F33] hover:bg-[#D6DCE3]/60 focus-visible:outline-[#B4531F] disabled:text-[#6B7785]',
    outline: 'bg-white text-[#0F1F33] border border-[#D6DCE3] hover:bg-[#F5F7F9] focus-visible:outline-[#B4531F] disabled:text-[#6B7785]',
  }

  const sizes = {
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
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
