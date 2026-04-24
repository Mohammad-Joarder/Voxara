import { NextRequest, NextResponse } from 'next/server'

import { ensureCreatorForUser } from '@/lib/ensure-creator'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Build redirect on the *same host* the user used (required for Netlify and custom domains).
 * Using only env.NEXT_PUBLIC_APP_URL can send people to localhost or the wrong site after
 * they click the email link.
 */
function redirectToRequest(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin))
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
        type: type as 'email' | 'recovery' | 'invite' | 'email_change' | 'signup' | 'magiclink'
      })
      if (error) {
        return redirectToRequest(request, `/login?error=${encodeURIComponent(error.message)}`)
      }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        return redirectToRequest(request, `/login?error=${encodeURIComponent(error.message)}`)
      }
    } else {
      return redirectToRequest(request, '/login?error=invalid_auth_link')
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return redirectToRequest(request, '/login?error=user_not_found')
    }

    const creator = await ensureCreatorForUser({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    })

    const nextPath = creator.consentAiAnalysis ? '/dashboard' : '/onboarding'
    return redirectToRequest(request, nextPath)
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Authentication confirmation failed'
    const isDbUnreachable =
      /Can't reach database server|P1001|connect ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(raw)
    const message = isDbUnreachable
      ? 'Your account was verified, but the app cannot reach the database. Check DATABASE_URL, that your Supabase project is not paused, and your network allows outbound database connections.'
      : raw
    return redirectToRequest(request, `/login?error=${encodeURIComponent(message)}`)
  }
}
