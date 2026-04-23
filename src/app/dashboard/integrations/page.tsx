'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

const CHANNEL_HINT_KEY = 'voxara_youtube_channel_hint'

type CreatorAccount = {
  id: string
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM'
  platformUsername: string
  isActive: boolean
  channelName: string | null
}

type VerifyPayload = {
  connected: boolean
  message: string
  channel: {
    id: string
    title: string
    handle: string
    subscriberCount: number
  } | null
  expectedMatch: boolean | null
}

function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' className={className} fill='currentColor' aria-hidden>
      <path d='M23.5 6.2a2.8 2.8 0 0 0-2-1.9C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.8a2.8 2.8 0 0 0-2 1.9A32 32 0 0 0 0 12a32 32 0 0 0 .5 4.6 2.8 2.8 0 0 0 2 2.1C4.4 20.5 12 20.5 12 20.5s7.6 0 9.5-.8a2.8 2.8 0 0 0 2-2.1A32 32 0 0 0 24 12a32 32 0 0 0-.5-4.8zM9.7 15.3V8.7L15.5 12l-5.8 3.3z' />
    </svg>
  )
}

function IntegrationsInner() {
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [channelInput, setChannelInput] = useState('')
  const [connectLoading, setConnectLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [ytAccount, setYtAccount] = useState<CreatorAccount | null>(null)
  const [lastVerify, setLastVerify] = useState<VerifyPayload | null>(null)

  const loadAccounts = useCallback(async () => {
    const response = await fetch('/api/creators/me', { cache: 'no-store' })
    if (!response.ok) {
      return
    }
    const payload = (await response.json()) as { data: { connectedAccounts: CreatorAccount[] } }
    const list = payload.data.connectedAccounts
    const yt = list.find((a) => a.platform === 'YOUTUBE' && a.isActive) ?? null
    setYtAccount(yt)
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem(CHANNEL_HINT_KEY)
    if (stored) {
      setChannelInput(stored)
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      showToast({
        title: 'Account connected',
        description: 'We saved your YouTube credentials securely. Use “Check connection” to confirm the API is responding.',
        variant: 'success'
      })
      void loadAccounts()
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('connected')
        window.history.replaceState({}, '', url.pathname)
      }
    }
  }, [searchParams, showToast, loadAccounts])

  const handleConnect = async () => {
    if (channelInput.trim()) {
      sessionStorage.setItem(CHANNEL_HINT_KEY, channelInput.trim())
    } else {
      sessionStorage.removeItem(CHANNEL_HINT_KEY)
    }
    setConnectLoading(true)
    try {
      const response = await fetch('/api/auth/connect/youtube', { method: 'POST' })
      const payload = (await response.json()) as
        | { data: { authUrl: string } }
        | { error: string; code: string }
      if (!response.ok || !('data' in payload)) {
        showToast({
          title: 'Could not start Google sign-in',
          description: 'error' in payload ? payload.error : 'Unknown error',
          variant: 'error'
        })
        return
      }
      window.location.href = payload.data.authUrl
    } finally {
      setConnectLoading(false)
    }
  }

  const handleCheck = async () => {
    setCheckLoading(true)
    setLastVerify(null)
    try {
      const response = await fetch('/api/integrations/youtube/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelUrlOrId: channelInput.trim() || undefined
        })
      })
      const body = (await response.json()) as
        | { data: VerifyPayload }
        | { error: string; code: string }

      if (!response.ok || !('data' in body)) {
        showToast({
          title: 'Check failed',
          description: 'error' in body ? body.error : 'Request failed',
          variant: 'error'
        })
        return
      }

      setLastVerify(body.data)
      if (!body.data.connected) {
        showToast({
          title: 'YouTube is not connected',
          description: body.data.message,
          variant: 'info'
        })
        return
      }

      if (body.data.expectedMatch === false) {
        showToast({
          title: 'Channel does not match',
          description:
            'The signed-in channel differs from the URL or @handle you entered. Confirm you use the right Google account or update the field.',
          variant: 'error'
        })
        return
      }

      showToast({
        title: 'Connection is healthy',
        description: `Verified ${body.data.channel?.title ?? 'your channel'}.`,
        variant: 'success'
      })
    } finally {
      setCheckLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!ytAccount) {
      return
    }
    const response = await fetch(`/api/accounts/${ytAccount.id}`, { method: 'DELETE' })
    if (response.ok) {
      sessionStorage.removeItem(CHANNEL_HINT_KEY)
      setChannelInput('')
      setYtAccount(null)
      setLastVerify(null)
      showToast({ title: 'YouTube disconnected', variant: 'info' })
    }
  }

  const isConnected = Boolean(ytAccount)

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-sm font-medium uppercase tracking-wide text-surface-500'>Phase 1</h2>
        <p className='mt-1 text-2xl font-semibold tracking-tight text-brand-600'>Integrations</p>
        <p className='mt-2 max-w-2xl text-sm leading-relaxed text-surface-600'>
          Connect YouTube with Google OAuth, then run a read-only check against the YouTube Data API. Add your
          channel link or ID before connecting if you want to compare it after sign-in.
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card
          className='overflow-hidden border-surface-200/80 shadow-soft lg:col-span-2'
          padding='none'
        >
          <div className='border-b border-surface-200 bg-gradient-to-r from-surface-50 to-white px-6 py-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-surface-200'>
                  <YouTubeGlyph className='h-7 w-7 text-red-600' />
                </div>
                <div>
                  <h3 className='text-base font-semibold text-surface-900'>YouTube</h3>
                  <p className='text-sm text-surface-600'>Comments, channel metadata, and analytics scopes</p>
                </div>
              </div>
              {isConnected ? (
                <Badge variant='positive'>Connected</Badge>
              ) : (
                <Badge variant='neutral'>Not connected</Badge>
              )}
            </div>
          </div>
          <div className='space-y-5 p-6 md:p-8'>
            <Input
              name='channelUrlOrId'
              label='YouTube channel URL, @handle, or channel ID'
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder='https://www.youtube.com/@yourchannel or UC…'
              helperText='Optional before OAuth. After you connect, use “Check connection” to confirm the API and match this hint.'
            />

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button
                variant='accent'
                className='sm:min-w-[9rem]'
                loading={connectLoading}
                onClick={handleConnect}
                type='button'
              >
                {isConnected ? 'Reconnect YouTube' : 'Connect with Google'}
              </Button>
              <Button
                variant='secondary'
                className='sm:min-w-[10rem]'
                loading={checkLoading}
                onClick={handleCheck}
                type='button'
              >
                Check connection
              </Button>
              {isConnected ? (
                <Button variant='ghost' className='text-surface-600' onClick={handleDisconnect} type='button'>
                  Disconnect
                </Button>
              ) : null}
            </div>

            {isConnected && ytAccount ? (
              <p className='text-sm text-surface-600'>
                Saved account: <span className='font-medium text-surface-900'>@{ytAccount.platformUsername}</span>
                {ytAccount.channelName ? (
                  <span> · {ytAccount.channelName}</span>
                ) : null}
              </p>
            ) : null}

            {lastVerify?.connected && lastVerify.channel ? (
              <div className='rounded-xl border border-accent-200/80 bg-accent-50/50 p-4 text-sm text-surface-800'>
                <p className='font-medium text-brand-600'>Last API check</p>
                <ul className='mt-2 space-y-1.5 text-surface-700'>
                  <li>
                    Channel: <span className='font-medium'>{lastVerify.channel.title}</span>
                  </li>
                  <li>ID: {lastVerify.channel.id}</li>
                  <li>Subscribers: {lastVerify.channel.subscriberCount.toLocaleString()}</li>
                  {lastVerify.expectedMatch === true ? (
                    <li className='font-medium text-emerald-700'>Matches the channel you entered in the field above.</li>
                  ) : null}
                  {lastVerify.expectedMatch === false ? (
                    <li className='text-amber-800'>Does not match the value in the field (see toast).</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className='h-fit border-surface-200/80 bg-surface-50/50' padding='lg'>
          <h4 className='text-sm font-semibold text-surface-900'>How it works</h4>
          <ol className='mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-surface-600'>
            <li>Optionally enter your public channel link or ID so we can compare after sign-in.</li>
            <li>Connect with Google; approve read-only YouTube and YouTube Analytics access.</li>
            <li>Run “Check connection” to confirm tokens work and that the channel lines up with your hint.</li>
          </ol>
          <p className='mt-4 text-xs text-surface-500'>
            Need other networks? <Link className='font-medium text-brand-600 hover:underline' href='/onboarding'>Use onboarding</Link> for
            TikTok and Instagram, or see{' '}
            <Link className='font-medium text-brand-600 hover:underline' href='/dashboard/accounts'>connected accounts</Link>.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className='text-sm text-surface-500' role='status'>
          Loading…
        </div>
      }
    >
      <IntegrationsInner />
    </Suspense>
  )
}
