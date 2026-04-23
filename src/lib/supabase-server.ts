import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/env'

export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0
          })
        }
      }
    }
  )
}
