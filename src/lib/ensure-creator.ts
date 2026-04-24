import { prisma } from '@/lib/prisma'

export function displayNameFromEmail(email: string) {
  return email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Creator'
}

type UserLike = {
  id: string
  email?: string | null
  user_metadata?: {
    displayName?: string
    full_name?: string
    display_name?: string
  } | null
}

/**
 * Create or update the `creators` row for a Supabase user (id matches auth.users).
 */
export async function ensureCreatorForUser(user: UserLike) {
  const email = user.email
  if (!email) {
    throw new Error('user_email_required')
  }
  const meta = user.user_metadata
  const fromMeta =
    (typeof meta?.displayName === 'string' && meta.displayName.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    ''
  const displayName = fromMeta || displayNameFromEmail(email)

  return prisma.creator.upsert({
    where: { id: user.id },
    update: { email },
    create: {
      id: user.id,
      email,
      displayName
    },
    select: { consentAiAnalysis: true, id: true, email: true, displayName: true }
  })
}
