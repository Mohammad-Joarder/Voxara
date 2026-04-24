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

function postOnboardingPath(consentAiAnalysis: boolean) {
  return consentAiAnalysis ? '/dashboard' : '/onboarding'
}

function describeOtpError(message: string, callbackUrl: string) {
  if (/confirmation email|sending|smtp|email/i.test(message) || message.length < 5) {
    return {
      title: 'Could not send the link',
      description: `${message} In Supabase → Authentication → URL: set Site URL to ${window.location.origin} and add this redirect: ${callbackUrl}. Turn on Custom SMTP (Auth → Emails) if mail still fails.`
    }
  }
  return { title: 'Could not send the link', description: message }
}

function RegisterContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      showToast({
        title: 'Error',
        description: decodeURIComponent(err),
        variant: 'error'
      })
    }
  }, [searchParams, showToast])

  useEffect(() => {
    const goIfLoggedIn = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) {
        return
      }
      const r = await fetch('/api/creators/me', { cache: 'no-store', credentials: 'include' })
      if (r.status === 401) {
        return
      }
      if (r.ok) {
        const p = (await r.json()) as { data: { creator: { consentAiAnalysis: boolean } } }
        router.replace(postOnboardingPath(p.data.creator.consentAiAnalysis))
        return
      }
      if (r.status === 404) {
        router.replace('/onboarding')
      }
    }
    void goIfLoggedIn()
  }, [router, supabase])

  const afterSessionBootstrap = async () => {
    await fetch('/api/creators/bootstrap', { method: 'POST', credentials: 'include' })
    const r = await fetch('/api/creators/me', { cache: 'no-store', credentials: 'include' })
    if (r.status === 404) {
      router.replace('/onboarding')
      return
    }
    if (r.ok) {
      const p = (await r.json()) as { data: { creator: { consentAiAnalysis: boolean } } }
      router.replace(postOnboardingPath(p.data.creator.consentAiAnalysis))
      return
    }
    router.replace('/onboarding')
  }

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) {
      showToast({
        title: 'Password too short',
        description: 'Use at least 8 characters.',
        variant: 'error'
      })
      return
    }
    if (password !== passwordConfirm) {
      showToast({
        title: 'Passwords do not match',
        variant: 'error'
      })
      return
    }
    setRegisterLoading(true)
    try {
      const redirectTo = getAuthCallbackUrl() ?? `${window.location.origin}/auth/confirm`
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { displayName: name.trim() || undefined }
        }
      })
      if (error) {
        const friendly =
          /already|registered|exists/i.test(error.message) ? ' Try signing in instead.' : ''
        showToast({
          title: 'Could not create account',
          description: error.message + friendly,
          variant: 'error'
        })
        return
      }
      if (data.session) {
        showToast({ title: 'Account created', description: 'Setting up your profile…', variant: 'info' })
        await afterSessionBootstrap()
        return
      }
      showToast({
        title: 'Check your email',
        description: 'We sent a confirmation link to complete sign-up. Open it on this device in the same browser if possible.',
        variant: 'success'
      })
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email.trim()) {
      showToast({ title: 'Email required', description: 'Enter your email.', variant: 'error' })
      return
    }
    setMagicLoading(true)
    try {
      const emailRedirectTo = getAuthCallbackUrl() ?? `${window.location.origin}/auth/confirm`
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo, shouldCreateUser: true }
      })
      if (error) {
        const { title, description } = describeOtpError(error.message, emailRedirectTo)
        showToast({ title, description, variant: 'error' })
        return
      }
      showToast({
        title: 'Link sent',
        description: 'Check your email for the sign-in link.',
        variant: 'success'
      })
    } finally {
      setMagicLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      const redirectTo = getAuthCallbackUrl() ?? `${window.location.origin}/auth/confirm`
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) {
        showToast({ title: 'Google sign-in failed', description: error.message, variant: 'error' })
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
        <h1 className='text-2xl font-semibold tracking-tight text-brand-600'>Create an account</h1>
        <p className='mt-2 text-sm leading-relaxed text-surface-600'>
          Sign up to turn comments into clear insight. Use email and password, a magic link, or Google.
        </p>
        <form className='mt-6 space-y-4' onSubmit={handleRegister}>
          <Input
            label='Name'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Your name'
            autoComplete='name'
          />
          <Input
            label='Email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@creator.com'
            autoComplete='email'
          />
          <Input
            label='Password'
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='At least 8 characters'
            autoComplete='new-password'
          />
          <Input
            label='Confirm password'
            type='password'
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder='Same as above'
            autoComplete='new-password'
          />
          <Button className='w-full' type='submit' loading={registerLoading}>
            Create account
          </Button>
        </form>
        <div className='my-4 text-center text-xs font-medium uppercase text-surface-400'>or</div>
        <Button
          className='w-full'
          variant='secondary'
          type='button'
          loading={magicLoading}
          onClick={() => void handleMagicLink()}
        >
          Email me a sign-in link (new or existing)
        </Button>
        <div className='my-4 text-center text-xs uppercase text-surface-400'>or</div>
        <Button
          className='w-full'
          variant='secondary'
          type='button'
          loading={googleLoading}
          onClick={() => void handleGoogle()}
        >
          Continue with Google
        </Button>
        <p className='mt-6 text-center text-sm text-surface-600'>
          Already have an account?{' '}
          <Link href='/login' className='font-medium text-brand-600 hover:underline'>
            Sign in
          </Link>
        </p>
        <p className='mt-2 text-center text-xs text-surface-500'>
          By creating an account you agree to the{' '}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className='flex min-h-screen items-center justify-center bg-surface-50 px-4 py-10 text-sm text-surface-500'>
          Loading…
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}
