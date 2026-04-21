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
    <Card title='Connected accounts'>
      <div className='space-y-3'>
        {accounts.length === 0 ? (
          <p className='text-sm text-surface-600'>No connected accounts yet.</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className='rounded-lg border border-surface-200 px-3 py-2 text-sm'>
              {account.platform} · @{account.platformUsername} ·{' '}
              {account.isActive ? 'Active' : 'Disconnected'}
            </div>
          ))
        )}
      </div>
      <div className='mt-4'>
        <Link href='/onboarding'>
          <Button variant='secondary'>Manage connections</Button>
        </Link>
      </div>
    </Card>
  )
}
