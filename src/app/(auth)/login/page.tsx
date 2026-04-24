'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'

import { VoxaraMark } from '@/components/brand/VoxaraMark'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { getAuthCallbackUrl } from '@/lib/auth-callback'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

function postLoginPath(consentAiAnalysis: boolean) {
  return consentAiAnalysis ? '/dashboard' : '/onboarding'
}

function describeEmailSendError(
  supabaseErrorMessage: string,
  callbackUrl: string
): { title: string; description: string } {
  const m = supabaseErrorMessage
  if (/confirmation email|sending|smtp|email/i.test(m) || m.length < 5) {
    return {
      title: 'Failed to send login link',
      description: `${m} — In Supabase → Authentication → URL: Site URL and redirect ${callbackUrl} (see docs). For mail delivery, set Custom SMTP (Auth → Emails).`
    }
  }
  return { title: 'Failed to send login link', description: m }
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      showToast({
        title: 'Authentication error',
        description: decodeURIComponent(error),
        variant: 'error'
      })
    }
  }, [searchParams, showToast])

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) {
        return
      }

      const response = await fetch('/api/creators/me', { cache: 'no-store' })
      if (response.status === 401) {
        return
      }
      if (response.ok) {
        const payload = (await response.json()) as {
          data: { creator: { consentAiAnalysis: boolean } }
        }
        router.replace(postLoginPath(payload.data.creator.consentAiAnalysis))
        return
      }
      if (response.status === 404) {
        router.replace('/onboarding')
      }
    }
    void checkSession()
  }, [router, supabase])

  const handleMagicLink = async () => {
    if (!email.trim()) {
      showToast({
        title: 'Email required',
        description: 'Enter your email to receive a login link.',
        variant: 'error'
      })
      return
    }
    setLoading(true)
    try {
      const emailRedirectTo = getAuthCallbackUrl() ?? `${window.location.origin}/auth/confirm`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
          shouldCreateUser: true
        }
      })

      if (error) {
        const { title, description } = describeEmailSendError(error.message, emailRedirectTo)
        showToast({ title, description, variant: 'error' })
        return
      }

      showToast({
        title: 'Login link sent',
        description: 'Check your inbox for the magic link.',
        variant: 'success'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSignIn = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        showToast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'error'
        })
        return
      }
      if (!data.session) {
        showToast({
          title: 'Sign in failed',
          description: 'No session was created.',
          variant: 'error'
        })
        return
      }
      const response = await fetch('/api/creators/me', { cache: 'no-store' })
      if (response.status === 404) {
        router.replace('/onboarding')
        return
      }
      if (response.ok) {
        const payload = (await response.json()) as {
          data: { creator: { consentAiAnalysis: boolean } }
        }
        router.replace(postLoginPath(payload.data.creator.consentAiAnalysis))
        return
      }
      showToast({
        title: 'Sign in failed',
        description: 'Could not load your account.',
        variant: 'error'
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const redirectTo = getAuthCallbackUrl() ?? `${window.location.origin}/auth/confirm`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      })
      if (error) {
        showToast({
          title: 'Google sign in failed',
          description: error.message,
          variant: 'error'
        })
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-gradient-to-b from-surface-50 to-surface-100/80 px-4 py-10'>
      <Card className='w-full max-w-md border-surface-200/80 shadow-soft' padding='lg'>
        <div className='mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left'>
          <VoxaraMark size='lg' showWordmark priority className='sm:items-start' />
        </div>
        <h1 className='text-2xl font-semibold tracking-tight text-brand-600'>Welcome back</h1>
        <p className='mt-2 text-sm leading-relaxed text-surface-600'>
          Sign in to your dashboard and hear what your audience is really saying.
        </p>
        <form className='mt-6 space-y-4' onSubmit={handlePasswordSignIn}>
          <Input
            label='Email'
            type='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder='you@creator.com'
            autoComplete='email'
          />
          <Input
            label='Password'
            type='password'
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder='••••••••'
            autoComplete='current-password'
          />
          <Button className='w-full' loading={passwordLoading} type='submit'>
            Sign in
          </Button>
        </form>
        <div className='my-4 text-center text-xs font-medium uppercase text-surface-400'>or</div>
        <Button
          className='w-full'
          variant='secondary'
          loading={loading}
          type='button'
          onClick={() => void handleMagicLink()}
        >
          Email me a login link
        </Button>
        <div className='my-4 text-center text-xs uppercase text-surface-400'>or</div>
        <Button
          className='w-full'
          variant='secondary'
          loading={googleLoading}
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>
        <p className='mt-6 text-center text-sm text-surface-600'>
          New to Voxara?{' '}
          <Link href='/register' className='font-medium text-brand-600 hover:underline'>
            Create an account
          </Link>
        </p>
        <p className='mt-2 text-center text-xs text-surface-500'>
          By continuing you agree to the{' '}
          <Link href='/terms' className='text-brand-600 hover:underline'>
            Terms
          </Link>{' '}
          and{' '}
          <Link href='/privacy' className='text-brand-600 hover:underline'>
            Privacy Policy
          </Link>
          .
        </p>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className='flex min-h-screen items-center justify-center bg-surface-50 px-4 py-10 text-sm text-surface-500'>
          Loading…
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
