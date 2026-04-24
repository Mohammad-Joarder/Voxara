'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'

import { VoxaraMark } from '@/components/brand/VoxaraMark'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

type ConnectedAccount = {
  id: string
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM'
  platformUsername: string
  isActive: boolean
}

const consentText =
  'By continuing, you agree that [Platform Name] will analyse your social media comments using AI. This includes sentiment analysis, feedback extraction, and purchase intent detection. Your data is processed securely and never sold. You may request data deletion at any time from your account settings.'

const platforms = [
  { key: 'YOUTUBE', label: 'YouTube' },
  { key: 'TIKTOK', label: 'TikTok' },
  { key: 'INSTAGRAM', label: 'Instagram' }
] as const

function PlatformIcon({ platform }: { platform: ConnectedAccount['platform'] }) {
  if (platform === 'YOUTUBE') {
    return <svg viewBox='0 0 24 24' className='h-6 w-6 fill-red-600'><path d='M21.8 7.2a2.8 2.8 0 0 0-2-2c-1.7-.5-7.8-.5-7.8-.5s-6 0-7.8.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .2 4.8 2.8 2.8 0 0 0 2 2c1.8.5 7.8.5 7.8.5s6 0 7.8-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.2-4.8zM10 15.5v-7l6 3.5-6 3.5z' /></svg>
  }
  if (platform === 'TIKTOK') {
    return <svg viewBox='0 0 24 24' className='h-6 w-6 fill-surface-900'><path d='M16 3h3a5 5 0 0 0 2 3v3a8 8 0 0 1-5-1.7V14a7 7 0 1 1-7-7h1v3h-1a4 4 0 1 0 4 4V3h3z' /></svg>
  }
  return <svg viewBox='0 0 24 24' className='h-6 w-6 fill-pink-600'><path d='M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' /></svg>
}

function OnboardingContent() {
  const [step, setStep] = useState<1 | 2>(1)
  const [consentAi, setConsentAi] = useState(false)
  const [consentRetention, setConsentRetention] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()

  const activeConnectedCount = useMemo(
    () => accounts.filter((account) => account.isActive).length,
    [accounts]
  )

  const loadAccounts = async () => {
    const response = await fetch('/api/creators/me', { cache: 'no-store', credentials: 'include' })
    if (!response.ok) {
      return
    }
    const payload = (await response.json()) as {
      data: { connectedAccounts: ConnectedAccount[]; creator: { consentAiAnalysis: boolean } }
    }
    setAccounts(payload.data.connectedAccounts)
    if (payload.data.creator.consentAiAnalysis) {
      setStep(2)
      setConsentAi(true)
      setConsentRetention(true)
    }
  }

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected === 'true') {
      showToast({
        title: 'Account connected',
        description: 'Your account is ready for ingestion.',
        variant: 'success'
      })
    }
    if (error) {
      showToast({
        title: 'Connection failed',
        description: decodeURIComponent(error),
        variant: 'error'
      })
    }
    void loadAccounts()
  }, [searchParams, showToast])

  const handleConsentSubmit = async () => {
    setSavingConsent(true)
    try {
      const response = await fetch('/api/creators/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consentAiAnalysis: true,
          consentAcceptedAt: new Date().toISOString()
        })
      })
      if (!response.ok) {
        let description = 'Please try again or sign out and sign in again.'
        try {
          const err = (await response.json()) as { error?: string; code?: string }
          if (err.error) {
            description = err.error
          }
        } catch {
          // ignore
        }
        showToast({
          title: 'Could not save consent',
          description,
          variant: 'error'
        })
        return
      }

      setStep(2)
      showToast({
        title: 'Consent saved',
        variant: 'success'
      })
    } finally {
      setSavingConsent(false)
    }
  }

  const handleConnect = async (platform: ConnectedAccount['platform']) => {
    setLoadingPlatform(platform)
    try {
      const response = await fetch(`/api/auth/connect/${platform.toLowerCase()}`, { method: 'POST' })
      const payload = (await response.json()) as
        | { data: { authUrl: string } }
        | { error: string; code: string }
      if (!response.ok || !('data' in payload)) {
        showToast({
          title: 'Unable to start OAuth flow',
          description: 'error' in payload ? payload.error : 'Unknown error',
          variant: 'error'
        })
        return
      }
      window.location.href = payload.data.authUrl
    } finally {
      setLoadingPlatform(null)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    const response = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
    if (response.ok) {
      await loadAccounts()
      showToast({ title: 'Account disconnected', variant: 'info' })
    }
  }

  return (
    <main className='mx-auto flex min-h-screen max-w-4xl items-center justify-center bg-gradient-to-b from-surface-50 to-surface-100/80 px-4 py-10'>
      <Card className='w-full border-surface-200/80 shadow-soft' padding='lg'>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <VoxaraMark size='md' showWordmark />
            <div className='h-8 w-px bg-surface-200' aria-hidden />
            <div>
              <h1 className='text-xl font-semibold tracking-tight text-brand-600 sm:text-2xl'>Onboarding</h1>
              <p className='text-xs text-surface-500'>Set up your workspace</p>
            </div>
          </div>
          <Badge variant='default'>Step {step} of 2</Badge>
        </div>

        {step === 1 ? (
          <section className='space-y-5'>
            <h2 className='text-xl font-semibold'>Before we begin</h2>
            <div className='max-h-44 overflow-y-auto rounded-lg border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700'>
              {consentText}
            </div>
            <label className='flex items-start gap-2 text-sm text-surface-700'>
              <input
                type='checkbox'
                checked={consentAi}
                onChange={(event) => setConsentAi(event.target.checked)}
                className='mt-1'
              />
              I agree to AI analysis of my content and comments
            </label>
            <label className='flex items-start gap-2 text-sm text-surface-700'>
              <input
                type='checkbox'
                checked={consentRetention}
                onChange={(event) => setConsentRetention(event.target.checked)}
                className='mt-1'
              />
              I agree to the data retention period of 365 days (adjustable in settings)
            </label>
            <Button
              onClick={handleConsentSubmit}
              loading={savingConsent}
              disabled={!consentAi || !consentRetention}
            >
              Continue
            </Button>
          </section>
        ) : (
          <section className='space-y-6'>
            <div>
              <h2 className='text-xl font-semibold'>Connect your social accounts</h2>
              <p className='text-sm text-surface-600'>Connect at least one account to get started</p>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {platforms.map((platform) => {
                const account = accounts.find((item) => item.platform === platform.key && item.isActive)
                return (
                  <article key={platform.key} className='rounded-xl border border-surface-200 bg-white p-4'>
                    <div className='mb-3 flex items-center gap-2'>
                      <PlatformIcon platform={platform.key} />
                      <p className='font-medium'>{platform.label}</p>
                    </div>
                    {account ? (
                      <div className='space-y-2 text-sm'>
                        <p className='text-emerald-600'>✓ Connected as @{account.platformUsername}</p>
                        <button
                          className='text-red-600 hover:underline'
                          onClick={() => handleDisconnect(account.id)}
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <Button
                        size='sm'
                        loading={loadingPlatform === platform.key}
                        onClick={() => handleConnect(platform.key)}
                      >
                        Connect
                      </Button>
                    )}
                  </article>
                )
              })}
            </div>
            <Button disabled={activeConnectedCount < 1} onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </section>
        )}
      </Card>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className='mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 text-sm text-surface-500'>
          Loading…
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}
