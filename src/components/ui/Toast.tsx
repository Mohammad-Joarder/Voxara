'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

type ToastMessage = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

type ToastContextValue = {
  showToast: (input: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneMap: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-brand-200 bg-brand-50 text-brand-800'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((input: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID()
    const toast: ToastMessage = { id, ...input }
    setToasts((current) => [...current, toast])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4000)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className='pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2'>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto rounded-xl border px-4 py-3 shadow-soft transition',
              toneMap[toast.variant]
            )}
          >
            <p className='text-sm font-semibold'>{toast.title}</p>
            {toast.description ? <p className='mt-1 text-xs'>{toast.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
