import { z } from 'zod'

import { fail, ok } from '@/lib/api'
import { postOtpNoPkce } from '@/lib/gotrue-server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-service-role'

const bodySchema = z.object({
  email: z.string().email().max(320),
  redirectTo: z.string().url().max(2048)
})

/**
 * Server-side passwordless link: no PKCE in the JSON body (avoids GoTrue
 * "Error sending confirmation email" that still happens for some clients).
 * Tries: OTP create_user → OTP sign-in only → admin invite (no PKCE, per Supabase docs).
 */
export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return fail('Invalid JSON', 'VALIDATION_ERROR', 400)
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Invalid body', 'VALIDATION_ERROR', 400)
  }
  const { email, redirectTo } = parsed.data

  const r1 = await postOtpNoPkce({ email, redirectTo, createUser: true })
  if (r1.ok) {
    return ok({ sent: true, method: 'otp_create' as const })
  }

  const r2 = await postOtpNoPkce({ email, redirectTo, createUser: false })
  if (r2.ok) {
    return ok({ sent: true, method: 'otp_signin' as const })
  }

  const admin = createSupabaseServiceRoleClient()
  const { data: _u, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo
  })
  if (!invErr) {
    return ok({ sent: true, method: 'invite' as const })
  }

  const parts = [r1.ok ? '' : r1.message, r2.ok ? '' : r2.message, invErr.message].filter(Boolean)
  return fail(
    parts.length ? parts.join(' · ') : 'Could not send the email. Check Supabase Auth settings.',
    'EMAIL_SEND_FAILED',
    502
  )
}
