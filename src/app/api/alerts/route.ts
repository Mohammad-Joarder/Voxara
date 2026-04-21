import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    const alerts = await prisma.alert.findMany({
      where: {
        creatorId: user.id,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return ok(alerts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch alerts'
    return fail(message, 'ALERTS_FETCH_ERROR', 500)
  }
}
