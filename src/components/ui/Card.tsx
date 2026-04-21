import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type CardProps = {
  title?: string
  description?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

export function Card({ title, description, padding = 'md', className, children }: CardProps) {
  return (
    <section className={cn('rounded-2xl border border-surface-200 bg-white shadow-soft', className)}>
      {title || description ? (
        <header className='border-b border-surface-200 px-6 py-4'>
          {title ? <h3 className='text-base font-semibold text-surface-900'>{title}</h3> : null}
          {description ? <p className='text-sm text-surface-600'>{description}</p> : null}
        </header>
      ) : null}
      <div className={paddingStyles[padding]}>{children}</div>
    </section>
  )
}
