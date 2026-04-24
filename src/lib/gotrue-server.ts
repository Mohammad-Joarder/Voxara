import { env } from '@/env'

const API_VERSION = '2024-01-01'

function gotrueJsonHeaders(anon: boolean) {
  const key = anon ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY : env.SUPABASE_SERVICE_ROLE_KEY
  return {
    'Content-Type': 'application/json;charset=UTF-8',
    apikey: key,
    Authorization: `Bearer ${key}`,
    'X-Supabase-Api-Version': API_VERSION
  } as const
}

export type GoTrueOtpErrorBody = { error?: string; msg?: string; message?: string; error_description?: string }

/**
 * Public `/auth/v1/otp` call **without** `code_challenge` (PKCE). The browser
 * `@supabase/ssr` client can still end up with PKCE under some cache/order cases; this
 * is the canonical no-PKCE request GoTrue accepts for custom SMTP projects.
 */
export async function postOtpNoPkce(args: { email: string; redirectTo: string; createUser: boolean }) {
  const base = new URL('/auth/v1/otp', env.NEXT_PUBLIC_SUPABASE_URL)
  base.searchParams.set('redirect_to', args.redirectTo)
  const res = await fetch(base.toString(), {
    method: 'POST',
    headers: { ...gotrueJsonHeaders(true) } as unknown as Record<string, string>,
    body: JSON.stringify({
      email: args.email,
      data: {},
      create_user: args.createUser
    })
  })
  if (res.ok) {
    return { ok: true as const }
  }
  let body: GoTrueOtpErrorBody = {}
  try {
    body = (await res.json()) as GoTrueOtpErrorBody
  } catch {
    // ignore
  }
  const text =
    body.error_description || body.error || body.msg || body.message || (await res.text().catch(() => '')) || 'OTP request failed'
  return { ok: false as const, status: res.status, message: text }
}

/**
 * Email/password sign-up **without** `code_challenge` in the JSON body.
 */
export async function postSignupNoPkce(args: {
  email: string
  password: string
  redirectTo: string
  data: Record<string, unknown>
}) {
  const base = new URL('/auth/v1/signup', env.NEXT_PUBLIC_SUPABASE_URL)
  base.searchParams.set('redirect_to', args.redirectTo)
  const res = await fetch(base.toString(), {
    method: 'POST',
    headers: { ...gotrueJsonHeaders(true) } as unknown as Record<string, string>,
    body: JSON.stringify({
      email: args.email,
      password: args.password,
      data: args.data,
      gotrue_meta_security: {}
    })
  })
  const text = await res.text()
  let json: { access_token?: string; refresh_token?: string; user?: unknown; error?: string; msg?: string; message?: string } = {}
  try {
    json = text ? (JSON.parse(text) as typeof json) : {}
  } catch {
    // ignore
  }
  if (!res.ok) {
    const m = json.message || json.msg || json.error || text || 'Sign up failed'
    return { ok: false as const, status: res.status, message: m }
  }
  return { ok: true as const, data: json as Record<string, unknown> }
}
