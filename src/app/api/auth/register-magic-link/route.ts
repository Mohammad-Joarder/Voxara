import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { env } from '@/env'
import { fail, ok } from '@/lib/api'

const bodySchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url()
})

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'Unknown error'
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Invalid request', 'VALIDATION_ERROR', 400)
    }

    const { email, redirectTo } = parsed.data

    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const createAttempt = await anon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    })
    if (!createAttempt.error) {
      return ok({ sent: true, method: 'otp_create_user' })
    }

    const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const inviteAttempt = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
    if (!inviteAttempt.error) {
      return ok({ sent: true, method: 'invite_user' })
    }

    const signinAttempt = await anon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false
      }
    })
    if (!signinAttempt.error) {
      return ok({ sent: true, method: 'otp_existing_user' })
    }

    const combined = [
      createAttempt.error.message,
      inviteAttempt.error.message,
      signinAttempt.error.message
    ].join(' | ')

    return fail(combined, 'AUTH_EMAIL_SEND_FAILED', 502)
  } catch (error) {
    return fail(messageOf(error), 'AUTH_EMAIL_SEND_FAILED', 500)
  }
}
