import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/env'

/**
 * Magic link must not use the SSR `createBrowserClient` default of PKCE. That flow sends
 * `code_challenge` to `/auth/v1/otp`; in many Supabase projects this returns a generic
 * "Error sending confirmation email" even when SMTP and redirects are correct. The plain
 * supabase-js default is `implicit` for this call (no code challenge).
 */
let client: SupabaseClient | null = null

export function getSupabaseOtpClient() {
  if (typeof window === 'undefined') {
    throw new Error('OTP client is browser-only')
  }
  if (!client) {
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'implicit',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  return client
}
