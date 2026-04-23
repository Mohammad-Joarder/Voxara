import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function requireAuthUser() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return user
}
