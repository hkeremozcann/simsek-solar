import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  acik: boolean
  kapat: () => void
  baslik: string
  children: React.ReactNode
  className?: string
  genislik?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ acik, kapat, baslik, children, className, genislik = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!acik) return

    const ilkOdak = closeRef.current
    ilkOdak?.focus()

    // Odak hapsi
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        kapat()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const odaklanabilir = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const ilk = odaklanabilir[0]
      const son = odaklanabilir[odaklanabilir.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === ilk) {
          e.preventDefault()
          son?.focus()
        }
      } else {
        if (document.activeElement === son) {
          e.preventDefault()
          ilk?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [acik, kapat])

  if (!acik) return null

  const genislikStipler = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-baslik"
    >
      {/* Arka plan */}
      <div
        className="absolute inset-0 bg-[#0F1F33]/60"
        onClick={kapat}
        aria-hidden
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-white rounded border border-[#D6DCE3] shadow-lg fade-in',
          genislikStipler[genislik],
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DCE3]">
          <h2
            id="modal-baslik"
            className="text-lg font-semibold text-[#0F1F33]"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {baslik}
          </h2>
          <button
            ref={closeRef}
            onClick={kapat}
            className="p-2 rounded hover:bg-[#F5F7F9] text-[#6B7785] hover:text-[#0F1F33] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Kapat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
