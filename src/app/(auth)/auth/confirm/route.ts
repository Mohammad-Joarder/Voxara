import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/env'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
}

function getDisplayNameFromEmail(email: string) {
  return email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Creator'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const url = new URL(request.url)
    const tokenHash = url.searchParams.get('token_hash')
    const type = url.searchParams.get('type')
    const code = url.searchParams.get('code')

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'email' | 'recovery' | 'invite' | 'email_change'
      })
      if (error) {
        return redirectTo(`/login?error=${encodeURIComponent(error.message)}`)
      }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        return redirectTo(`/login?error=${encodeURIComponent(error.message)}`)
      }
    } else {
      return redirectTo('/login?error=invalid_auth_link')
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return redirectTo('/login?error=user_not_found')
    }

    const creator = await prisma.creator.upsert({
      where: { id: user.id },
      update: {
        email: user.email
      },
      create: {
        id: user.id,
        email: user.email,
        displayName: getDisplayNameFromEmail(user.email)
      },
      select: { consentAiAnalysis: true }
    })

    const nextPath = creator.consentAiAnalysis ? '/dashboard' : '/onboarding'
    return redirectTo(nextPath)
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Authentication confirmation failed'
    const isDbUnreachable =
      /Can't reach database server|P1001|connect ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(raw)
    const message = isDbUnreachable
      ? 'Your account was verified, but the app cannot reach the database. Check DATABASE_URL, that your Supabase project is not paused, and your network allows outbound database connections.'
      : raw
    return redirectTo(`/login?error=${encodeURIComponent(message)}`)
  }
}
