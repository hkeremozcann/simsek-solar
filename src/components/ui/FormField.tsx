import React, { useId } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: (id: string, describedBy?: string) => React.ReactNode
  className?: string
}

export function FormField({ label, error, hint, required, children, className }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-medium text-[#0F1F33]">
        {label}
        {required && <span className="text-[#B3261E] ml-0.5" aria-hidden>*</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-[#6B7785]">{hint}</p>
      )}
      {children(id, describedBy)}
      {error && (
        <p id={errorId} className="text-xs text-[#B3261E] flex items-center gap-1" role="alert">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 rounded border text-sm text-[#0F1F33] bg-white',
        'placeholder:text-[#6B7785]',
        'focus:outline-none focus:ring-2 focus:ring-[#B4531F] focus:border-transparent',
        error
          ? 'border-[#B3261E] bg-red-50'
          : 'border-[#D6DCE3] hover:border-[#6B7785]',
        className
      )}
      aria-invalid={error}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 rounded border text-sm text-[#0F1F33] bg-white',
        'focus:outline-none focus:ring-2 focus:ring-[#B4531F] focus:border-transparent',
        error
          ? 'border-[#B3261E]'
          : 'border-[#D6DCE3] hover:border-[#6B7785]',
        className
      )}
      aria-invalid={error}
      {...props}
    >
      {children}
    </select>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 rounded border text-sm text-[#0F1F33] bg-white resize-y min-h-[80px]',
        'placeholder:text-[#6B7785]',
        'focus:outline-none focus:ring-2 focus:ring-[#B4531F] focus:border-transparent',
        error
          ? 'border-[#B3261E] bg-red-50'
          : 'border-[#D6DCE3] hover:border-[#6B7785]',
        className
      )}
      aria-invalid={error}
      {...props}
    />
  )
}

interface CheckboxGroupProps {
  id: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  describedBy?: string
}

export function CheckboxGroup({ id, options, value, onChange, describedBy }: CheckboxGroupProps) {
  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v))
    } else {
      onChange([...value, v])
    }
  }

  return (
    <div id={id} role="group" aria-describedby={describedBy} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = value.includes(opt.value)
        return (
          <label
            key={opt.value}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded border cursor-pointer text-sm transition-colors min-h-[44px]',
              checked
                ? 'bg-[#1B4B73]/10 border-[#1B4B73] text-[#1B4B73] font-medium'
                : 'bg-white border-[#D6DCE3] text-[#0F1F33] hover:border-[#6B7785]'
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => toggle(opt.value)}
            />
            <span aria-hidden className={checked ? 'text-[#1B4B73]' : 'text-[#D6DCE3]'}>
              {checked ? '☑' : '☐'}
            </span>
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}
