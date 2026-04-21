'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
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

      const response = await fetch('/api/creators/me')
      if (response.ok) {
        router.replace('/dashboard')
      } else {
        router.replace('/onboarding')
      }
    }
    void checkSession()
  }, [router, supabase])

  const handleMagicLink = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth/confirm`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      })

      if (error) {
        showToast({
          title: 'Failed to send login link',
          description: error.message,
          variant: 'error'
        })
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth/confirm`
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
    <main className='flex min-h-screen items-center justify-center bg-surface-50 px-4 py-10'>
      <Card className='w-full max-w-md' padding='lg'>
        <h1 className='text-2xl font-semibold text-surface-900'>Welcome to Voxara</h1>
        <p className='mt-2 text-sm text-surface-600'>
          Sign in to access your AI influencer analytics dashboard.
        </p>
        <form className='mt-6 space-y-4' onSubmit={handleMagicLink}>
          <Input
            label='Email'
            type='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder='you@creator.com'
          />
          <Button className='w-full' loading={loading} type='submit'>
            Send login link
          </Button>
        </form>
        <div className='my-5 text-center text-xs uppercase text-surface-400'>or</div>
        <Button
          className='w-full'
          variant='secondary'
          loading={googleLoading}
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>
        <p className='mt-6 text-center text-xs text-surface-500'>
          By signing up you agree to our{' '}
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
