import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/env'

/**
 * Default @supabase/ssr browser client (PKCE). Required so magic / OAuth links that return
 * `?code=...` work with `exchangeCodeForSession` in /auth/confirm. Do not set flowType: 'implicit'
 * here or email-link redirects will fail after the user clicks the link.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
