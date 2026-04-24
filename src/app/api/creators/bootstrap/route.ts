import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { ensureCreatorForUser } from '@/lib/ensure-creator'

/**
 * Ensures a `creators` row exists after sign-up (e.g. when email confirmation is off and
 * the user got a session without hitting /auth/confirm). Idempotent.
 */
export async function POST() {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }
    if (!user.email) {
      return fail('No email on account', 'BAD_REQUEST', 400)
    }
    const creator = await ensureCreatorForUser({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    })
    return ok(creator)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create profile'
    return fail(message, 'CREATOR_BOOTSTRAP_ERROR', 500)
  }
}
