import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { getPlatformConnector } from '@/lib/connectors'
import { decrypt } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Params = { params: { id: string } }
const paramsSchema = z.object({ id: z.string().min(1, 'Account id is required') })

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    const parsedParams = paramsSchema.safeParse(params)
    if (!parsedParams.success) {
      return fail(parsedParams.error.errors[0]?.message ?? 'Invalid account id', 'VALIDATION_ERROR', 400)
    }

    const account = await prisma.connectedAccount.findUnique({
      where: { id: parsedParams.data.id }
    })

    if (!account || account.creatorId !== user.id) {
      return fail('Connected account not found', 'NOT_FOUND', 404)
    }

    try {
      if (account.accessTokenEncrypted) {
        const accessToken = decrypt(account.accessTokenEncrypted)
        await getPlatformConnector(account.platform).revokeToken(accessToken)
      }
    } catch {
      // Best effort revoke, never block account disconnect.
    }

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        isActive: false,
        accessTokenEncrypted: '',
        refreshTokenEncrypted: ''
      }
    })

    return ok({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect account'
    return fail(message, 'ACCOUNT_DELETE_ERROR', 500)
  }
}
