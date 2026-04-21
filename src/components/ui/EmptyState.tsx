import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
  cta?: ReactNode
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 px-6 py-12 text-center'>
      <div className='mb-4 text-brand-600'>{icon}</div>
      <h3 className='text-lg font-semibold text-surface-900'>{title}</h3>
      <p className='mt-2 max-w-lg text-sm text-surface-600'>{description}</p>
      {cta ? <div className='mt-5'>{cta}</div> : null}
    </div>
  )
}
