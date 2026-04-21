import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type AccountIngestionStatus = {
  connectedAccountId: string
  platform: string
  platformUsername: string
  lastSyncedAt: Date | null
  commentsIngested24h: number
  isActive: boolean
  lastSyncStatus: string | null
}

export async function GET() {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const accounts = await prisma.connectedAccount.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    const rows: AccountIngestionStatus[] = await Promise.all(
      accounts.map(async (account) => {
        const aggregate = await prisma.ingestionLog.aggregate({
          where: {
            creatorId: user.id,
            connectedAccountId: account.id,
            startedAt: { gte: since }
          },
          _sum: {
            commentsIngested: true
          }
        })

        const latest = await prisma.ingestionLog.findFirst({
          where: {
            creatorId: user.id,
            connectedAccountId: account.id
          },
          orderBy: { createdAt: 'desc' },
          select: { status: true }
        })

        return {
          connectedAccountId: account.id,
          platform: account.platform,
          platformUsername: account.platformUsername,
          lastSyncedAt: account.lastSyncedAt,
          commentsIngested24h: aggregate._sum.commentsIngested ?? 0,
          isActive: account.isActive,
          lastSyncStatus: latest?.status ?? null
        }
      })
    )

    return ok(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch ingestion status'
    return fail(message, 'INGESTION_STATUS_ERROR', 500)
  }
}
