'use client'

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

type Creator = {
  id: string
  email: string
  displayName: string
  dataRetentionDays: number
}

type ConnectedAccount = {
  id: string
  platform: string
  platformUsername: string
  followerCount: number | null
  lastSyncedAt: string | null
  isActive: boolean
}

export default function SettingsPage() {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [displayName, setDisplayName] = useState('')
  const [dataRetentionDays, setDataRetentionDays] = useState(365)
  const [saving, setSaving] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const { showToast } = useToast()

  const loadSettings = async () => {
    const response = await fetch('/api/creators/me', { cache: 'no-store' })
    if (!response.ok) {
      return
    }

    const payload = (await response.json()) as {
      data: { creator: Creator; connectedAccounts: ConnectedAccount[] }
    }

    setCreator(payload.data.creator)
    setAccounts(payload.data.connectedAccounts)
    setDisplayName(payload.data.creator.displayName)
    setDataRetentionDays(payload.data.creator.dataRetentionDays)
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const activeAccounts = useMemo(() => accounts.filter((item) => item.isActive), [accounts])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/creators/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, dataRetentionDays })
      })
      if (!response.ok) {
        showToast({ title: 'Failed to save settings', variant: 'error' })
        return
      }
      showToast({ title: 'Settings saved', variant: 'success' })
      await loadSettings()
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    const response = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    if (response.ok) {
      showToast({ title: 'Account disconnected', variant: 'info' })
      await loadSettings()
    }
  }

  return (
    <div className='space-y-6'>
      <Card title='Account settings' padding='md'>
        <div className='grid gap-4 md:grid-cols-2'>
          <Input label='Display name' value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label='Email' value={creator?.email ?? ''} disabled readOnly />
        </div>
      </Card>

      <Card title='Connected accounts' padding='md'>
        <div className='space-y-3'>
          {activeAccounts.length === 0 ? (
            <p className='text-sm text-surface-500'>No active accounts connected.</p>
          ) : (
            activeAccounts.map((account) => (
              <div
                key={account.id}
                className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-surface-200 px-3 py-2'
              >
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-surface-800'>
                    {account.platform} · @{account.platformUsername}
                  </p>
                  <p className='text-xs text-surface-500'>
                    Followers: {account.followerCount ?? 0} · Last synced:{' '}
                    {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <Button variant='danger' size='sm' onClick={() => handleDisconnect(account.id)}>
                  Disconnect
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title='Data & Privacy' padding='md'>
        <label className='block text-sm font-medium text-surface-700'>
          Data retention days: <span className='text-brand-700'>{dataRetentionDays}</span>
        </label>
        <input
          type='range'
          min={30}
          max={730}
          value={dataRetentionDays}
          onChange={(event) => setDataRetentionDays(Number(event.target.value))}
          className='mt-3 w-full'
        />
        <Button variant='secondary' className='mt-4'>
          Request data deletion
        </Button>
      </Card>

      <Card title='Notification preferences' padding='md'>
        <div className='space-y-3 text-sm'>
          <label className='flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2'>
            Email notifications
            <input
              type='checkbox'
              checked={emailNotifications}
              onChange={(event) => setEmailNotifications(event.target.checked)}
            />
          </label>
          <label className='flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2'>
            Push notifications
            <input
              type='checkbox'
              checked={pushNotifications}
              onChange={(event) => setPushNotifications(event.target.checked)}
            />
          </label>
          <Badge variant='neutral'>Notification persistence arrives in Phase 4</Badge>
        </div>
      </Card>

      <Button loading={saving} onClick={handleSave}>
        Save
      </Button>
    </div>
  )
}
