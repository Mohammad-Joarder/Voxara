import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const fieldId = id ?? props.name

  return (
    <div className='space-y-1.5'>
      {label ? (
        <label htmlFor={fieldId} className='text-sm font-medium text-surface-700'>
          {label}
        </label>
      ) : null}
      <input
        id={fieldId}
        className={cn(
          'w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-surface-100',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : '',
          className
        )}
        {...props}
      />
      {error ? <p className='text-xs text-red-600'>{error}</p> : null}
      {!error && helperText ? <p className='text-xs text-surface-500'>{helperText}</p> : null}
    </div>
  )
}
