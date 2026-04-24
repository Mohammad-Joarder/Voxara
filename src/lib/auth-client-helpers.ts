import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * GoTrue can return access/refresh at the root of the sign-up response or under `session`.
 */
export function getTokensFromAuthPayload(
  auth: Record<string, unknown> | null | undefined
): { access_token: string; refresh_token: string } | null {
  if (!auth || typeof auth !== 'object') {
    return null
  }
  if (typeof auth.access_token === 'string' && typeof auth.refresh_token === 'string') {
    return { access_token: auth.access_token, refresh_token: auth.refresh_token }
  }
  const s = auth.session
  if (s && typeof s === 'object' && s !== null) {
    const o = s as Record<string, unknown>
    if (typeof o.access_token === 'string' && typeof o.refresh_token === 'string') {
      return { access_token: o.access_token, refresh_token: o.refresh_token }
    }
  }
  return null
}

export async function setSessionIfTokens(
  supabase: SupabaseClient,
  auth: Record<string, unknown> | null | undefined
) {
  const tokens = getTokensFromAuthPayload(auth)
  if (!tokens) {
    return { ok: false as const }
  }
  const { error } = await supabase.auth.setSession(tokens)
  if (error) {
    return { ok: false as const, error }
  }
  return { ok: true as const }
}
