'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Alert = {
  id: string
  title: string
  description: string
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
  createdAt: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const load = async () => {
    const response = await fetch('/api/alerts', { cache: 'no-store' })
    if (!response.ok) {
      return
    }
    const payload = (await response.json()) as { data: Alert[] }
    setAlerts(payload.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const markRead = async (id: string) => {
    const response = await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' })
    if (response.ok) {
      await load()
    }
  }

  return (
    <Card title='Unread alerts'>
      <div className='space-y-3'>
        {alerts.length === 0 ? (
          <p className='text-sm text-surface-600'>No unread alerts.</p>
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className='rounded-lg border border-surface-200 px-3 py-3'>
              <div className='flex items-center justify-between gap-3'>
                <h3 className='font-medium text-surface-900'>{alert.title}</h3>
                <Badge
                  variant={
                    alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                      ? 'negative'
                      : alert.severity === 'WARNING'
                        ? 'ambiguous'
                        : 'neutral'
                  }
                >
                  {alert.severity}
                </Badge>
              </div>
              <p className='mt-2 text-sm text-surface-600'>{alert.description}</p>
              <div className='mt-3 flex items-center justify-between'>
                <p className='text-xs text-surface-500'>{new Date(alert.createdAt).toLocaleString()}</p>
                <Button size='sm' variant='secondary' onClick={() => markRead(alert.id)}>
                  Mark as read
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  )
}
