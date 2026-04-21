import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  deltaLabel: string
}

const trendStyles: Record<StatCardProps['trend'], string> = {
  up: 'bg-emerald-100 text-emerald-700',
  down: 'bg-red-100 text-red-700',
  neutral: 'bg-surface-200 text-surface-700'
}

const trendSymbol: Record<StatCardProps['trend'], string> = {
  up: '↑',
  down: '↓',
  neutral: '→'
}

export function StatCard({ label, value, trend, deltaLabel }: StatCardProps) {
  return (
    <article className='rounded-2xl border border-surface-200 bg-white p-5 shadow-soft'>
      <p className='text-sm font-medium text-surface-600'>{label}</p>
      <p className='mt-3 text-3xl font-semibold text-surface-900'>{value}</p>
      <span
        className={cn(
          'mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
          trendStyles[trend]
        )}
      >
        {trendSymbol[trend]} {deltaLabel}
      </span>
    </article>
  )
}
