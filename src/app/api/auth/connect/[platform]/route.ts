import { randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { getPlatformConnector } from '@/lib/connectors'
import { normalizePlatform } from '@/lib/platform'

type Params = { params: { platform: string } }

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    let platform: ReturnType<typeof normalizePlatform>
    try {
      platform = normalizePlatform(params.platform)
    } catch {
      return fail('Invalid platform', 'VALIDATION_ERROR', 400)
    }
    const state = randomBytes(16).toString('hex')
    const cookieStore = cookies()
    cookieStore.set({
      name: `oauth_state_${platform}`,
      value: state,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10
    })

    const authUrl = getPlatformConnector(platform).getAuthUrl(state)
    return ok({ authUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start OAuth flow'
    return fail(message, 'CONNECT_INIT_ERROR', 500)
  }
}
