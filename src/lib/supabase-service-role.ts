import { createClient } from '@supabase/supabase-js'

import { env } from '@/env'

/**
 * Service-role client: server only. Used for admin auth fallbacks (invite, never exposed to the browser).
 */
export function createSupabaseServiceRoleClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  })
}
