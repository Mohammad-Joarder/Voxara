import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '@/env'
import { requireAuthUser } from '@/lib/auth'
import { getPlatformConnector } from '@/lib/connectors'
import { encrypt } from '@/lib/crypto'
import { normalizePlatform } from '@/lib/platform'
import { prisma } from '@/lib/prisma'

type Params = { params: { platform: string } }
const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1)
})

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
}

function redirectWithError(message: string) {
  return redirectTo(`/onboarding?error=${encodeURIComponent(message)}`)
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const platform = normalizePlatform(params.platform)
    const url = new URL(request.url)
    const parsedQuery = callbackQuerySchema.safeParse({
      code: url.searchParams.get('code'),
      state: url.searchParams.get('state')
    })
    if (!parsedQuery.success) {
      return redirectWithError('Missing OAuth callback parameters')
    }
    const { code, state } = parsedQuery.data

    const user = await requireAuthUser()
    if (!user) {
      return redirectTo('/login?error=auth_required')
    }

    const cookieStore = cookies()
    const stateCookieName = `oauth_state_${platform}`
    const storedState = cookieStore.get(stateCookieName)?.value
    if (!storedState || storedState !== state) {
      return redirectWithError('Invalid OAuth state')
    }

    const connector = getPlatformConnector(platform)
    const tokens = await connector.exchangeCode(code)
    const profile = await connector.getProfile(tokens.accessToken)

    const connectedAccount = await prisma.connectedAccount.upsert({
      where: {
        creatorId_platform_platformUserId: {
          creatorId: user.id,
          platform,
          platformUserId: profile.platformUserId
        }
      },
      update: {
        platformUsername: profile.platformUsername,
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: encrypt(tokens.refreshToken),
        scopesGranted: tokens.scope,
        tokenExpiresAt: tokens.expiresAt,
        followerCount: profile.followerCount,
        channelName: profile.channelName,
        isActive: true
      },
      create: {
        creatorId: user.id,
        platform,
        platformUserId: profile.platformUserId,
        platformUsername: profile.platformUsername,
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: encrypt(tokens.refreshToken),
        scopesGranted: tokens.scope,
        tokenExpiresAt: tokens.expiresAt,
        followerCount: profile.followerCount,
        channelName: profile.channelName,
        isActive: true
      }
    })

    await prisma.ingestionLog.create({
      data: {
        connectedAccountId: connectedAccount.id,
        creatorId: user.id,
        platform,
        syncType: 'MANUAL',
        status: 'RUNNING',
        startedAt: new Date()
      }
    })

    cookieStore.set({
      name: stateCookieName,
      value: '',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0
    })

    return redirectTo('/dashboard/accounts?connected=true')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth callback failed'
    return redirectWithError(message)
  }
}
