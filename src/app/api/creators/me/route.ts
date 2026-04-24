import { z } from 'zod'

import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const updateCreatorSchema = z
  .object({
    displayName: z.string().min(2).max(80).optional(),
    consentAiAnalysis: z.boolean().optional(),
    consentAcceptedAt: z.string().datetime().optional(),
    dataRetentionDays: z.number().int().min(30).max(730).optional()
  })
  .refine(
    (input) => Object.keys(input).length > 0,
    'At least one profile field must be provided'
  )

export async function GET() {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    const creator = await prisma.creator.findUnique({
      where: { id: user.id }
    })
    if (!creator) {
      return fail('Creator record not found', 'NOT_FOUND', 404)
    }

    const connectedAccounts = await prisma.connectedAccount.findMany({
      where: { creatorId: user.id },
      select: {
        id: true,
        creatorId: true,
        platform: true,
        platformUserId: true,
        platformUsername: true,
        scopesGranted: true,
        tokenExpiresAt: true,
        lastSyncedAt: true,
        followerCount: true,
        channelName: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return ok({ creator, connectedAccounts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load creator profile'
    return fail(message, 'CREATOR_FETCH_ERROR', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    const body = (await request.json()) as unknown
    const parsed = updateCreatorSchema.safeParse(body)
    if (!parsed.success) {
      return fail(parsed.error.errors[0]?.message ?? 'Invalid request body', 'VALIDATION_ERROR', 400)
    }

    const data = parsed.data

    const update: {
      displayName?: string
      consentAiAnalysis?: boolean
      consentAcceptedAt?: Date | null
      dataRetentionDays?: number
    } = {}
    if (data.displayName !== undefined) update.displayName = data.displayName
    if (data.consentAiAnalysis !== undefined) update.consentAiAnalysis = data.consentAiAnalysis
    if (data.consentAcceptedAt !== undefined) {
      update.consentAcceptedAt = data.consentAcceptedAt ? new Date(data.consentAcceptedAt) : null
    }
    if (data.dataRetentionDays !== undefined) update.dataRetentionDays = data.dataRetentionDays

    const updated = await prisma.creator.upsert({
      where: { id: user.id },
      update,
      create: {
        id: user.id,
        email: user.email ?? `${user.id}@unknown.local`,
        displayName: data.displayName ?? 'Creator',
        consentAiAnalysis: data.consentAiAnalysis ?? false,
        consentAcceptedAt: data.consentAcceptedAt ? new Date(data.consentAcceptedAt) : null,
        dataRetentionDays: data.dataRetentionDays ?? 365
      }
    })

    return ok(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update creator profile'
    return fail(message, 'CREATOR_UPDATE_ERROR', 500)
  }
}
