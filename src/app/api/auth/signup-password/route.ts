import { z } from 'zod'

import { fail, ok } from '@/lib/api'
import { postSignupNoPkce } from '@/lib/gotrue-server'

const bodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  redirectTo: z.string().url().max(2048),
  data: z.record(z.string(), z.unknown()).optional()
})

/**
 * Server-side sign-up: POST /auth/v1/signup with **no** `code_challenge` (PKCE).
 * Returns session tokens to the client when "Confirm email" is off, so the
 * client can `setSession` and use cookie-backed APIs.
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
  const { email, password, redirectTo, data = {} } = parsed.data

  const res = await postSignupNoPkce({
    email,
    password,
    redirectTo,
    data: data as Record<string, unknown>
  })
  if (!res.ok) {
    return fail(res.message, 'SIGNUP_FAILED', res.status >= 500 ? res.status : 400)
  }
  return ok({ auth: res.data })
}
