import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/env'

/**
 * `createBrowserClient` from @supabase/ssr defaults to `flowType: "pkce"`, which makes
 * `auth.signUp` and `auth.signInWithOtp` send `code_challenge` to GoTrue. Many projects
 * then return a generic "Error sending confirmation email" before any mail is sent.
 * `implicit` avoids the PKCE body on those endpoints while still using the SSR cookie
 * session storage so our Next.js API and middleware can read the session.
 *
 * @see https://github.com/supabase/gotrue-js (signUp, signInWithOtp, flowType)
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { flowType: 'implicit' } }
  )
}
