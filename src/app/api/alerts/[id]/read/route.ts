import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Params = { params: { id: string } }
const paramsSchema = z.object({ id: z.string().min(1, 'Alert id is required') })

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    const parsedParams = paramsSchema.safeParse(params)
    if (!parsedParams.success) {
      return fail(parsedParams.error.errors[0]?.message ?? 'Invalid alert id', 'VALIDATION_ERROR', 400)
    }

    const alert = await prisma.alert.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, creatorId: true }
    })

    if (!alert || alert.creatorId !== user.id) {
      return fail('Alert not found', 'NOT_FOUND', 404)
    }

    const updated = await prisma.alert.update({
      where: { id: parsedParams.data.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return ok(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark alert as read'
    return fail(message, 'ALERT_READ_ERROR', 500)
  }
}
