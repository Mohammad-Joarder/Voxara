import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'ambiguous'
  | 'impact-high'
  | 'impact-medium'
  | 'impact-low'
  | 'default'

type BadgeProps = {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-red-100 text-red-700',
  neutral: 'bg-surface-200 text-surface-700',
  ambiguous: 'bg-amber-100 text-amber-700',
  'impact-high': 'bg-red-100 text-red-700',
  'impact-medium': 'bg-amber-100 text-amber-700',
  'impact-low': 'bg-surface-200 text-surface-700',
  default: 'bg-brand-100 text-brand-700'
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
