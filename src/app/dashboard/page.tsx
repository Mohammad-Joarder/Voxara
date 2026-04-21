'use client'

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/ui/StatCard'

type IngestionStatusRow = {
  connectedAccountId: string
  platform: string
  platformUsername: string
  lastSyncedAt: string | null
  commentsIngested24h: number
  isActive: boolean
  lastSyncStatus: string | null
}

export default function DashboardOverviewPage() {
  const [syncRows, setSyncRows] = useState<IngestionStatusRow[]>([])

  useEffect(() => {
    const loadData = async () => {
      const response = await fetch('/api/ingestion/status', { cache: 'no-store' })
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as { data: IngestionStatusRow[] }
      setSyncRows(payload.data)
    }
    void loadData()
  }, [])

  const commentsAnalysed = useMemo(
    () => syncRows.reduce((sum, row) => sum + row.commentsIngested24h, 0),
    [syncRows]
  )

  const hasAnalyticsData = commentsAnalysed > 0

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Comments analysed' value={String(commentsAnalysed)} trend='up' deltaLabel='12% vs last period' />
        <StatCard label='Positive sentiment' value='0%' trend='neutral' deltaLabel='No processed data yet' />
        <StatCard label='Purchase intent rate' value='0%' trend='neutral' deltaLabel='No processed data yet' />
        <StatCard label='Active insights' value='0' trend='neutral' deltaLabel='No insights generated yet' />
      </div>

      {!hasAnalyticsData ? (
        <EmptyState
          icon={
            <svg viewBox='0 0 24 24' className='h-12 w-12 fill-current'>
              <path d='M4 19h16v2H4zM7 17V7h2v10zm4 0V3h2v14zm4 0v-6h2v6z' />
            </svg>
          }
          title='No analytics data yet'
          description='Your analytics will appear here once comments are processed.'
        />
      ) : null}

      <section className='rounded-2xl border border-surface-200 bg-white p-5 shadow-soft'>
        <h2 className='text-lg font-semibold text-surface-900'>Sync status</h2>
        <div className='mt-4 space-y-3'>
          {syncRows.length === 0 ? (
            <p className='text-sm text-surface-500'>No connected accounts yet.</p>
          ) : (
            syncRows.map((row) => (
              <div
                key={row.connectedAccountId}
                className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-200 px-3 py-2'
              >
                <div>
                  <p className='text-sm font-medium text-surface-800'>
                    {row.platform} · @{row.platformUsername}
                  </p>
                  <p className='text-xs text-surface-500'>
                    Last sync:{' '}
                    {row.lastSyncedAt
                      ? new Date(row.lastSyncedAt).toLocaleString()
                      : 'Never synced'}
                  </p>
                </div>
                <Badge
                  variant={
                    row.lastSyncStatus === 'SUCCESS'
                      ? 'positive'
                      : row.lastSyncStatus === 'FAILED'
                        ? 'negative'
                        : 'neutral'
                  }
                >
                  {row.lastSyncStatus ?? (row.isActive ? 'PENDING' : 'INACTIVE')}
                </Badge>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
