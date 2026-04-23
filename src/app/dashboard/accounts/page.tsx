'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type ConnectedAccount = {
  id: string
  platform: string
  platformUsername: string
  isActive: boolean
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/creators/me', { cache: 'no-store' })
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as {
        data: { connectedAccounts: ConnectedAccount[] }
      }
      setAccounts(payload.data.connectedAccounts)
    }
    void load()
  }, [])

  return (
    <Card
      className='border-surface-200/80 shadow-soft'
      title='Connected accounts'
      description='Social accounts linked for ingestion and analytics'
    >
      <div className='space-y-2'>
        {accounts.length === 0 ? (
          <p className='text-sm text-surface-600'>No connected accounts yet.</p>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-200/80 bg-surface-50/50 px-4 py-3 text-sm'
            >
              <span className='font-medium text-surface-900'>{account.platform}</span>
              <span className='text-surface-600'>@{account.platformUsername}</span>
              <span className={account.isActive ? 'text-emerald-700' : 'text-amber-700'}>
                {account.isActive ? 'Active' : 'Disconnected'}
              </span>
            </div>
          ))
        )}
      </div>
      <div className='mt-5 flex flex-wrap gap-2'>
        <Link href='/dashboard/integrations'>
          <Button variant='primary'>YouTube & integrations</Button>
        </Link>
        <Link href='/onboarding'>
          <Button variant='secondary'>TikTok / Instagram setup</Button>
        </Link>
      </div>
    </Card>
  )
}
