import { YouTubeConnector } from '@/lib/connectors/youtube'
import type { PlatformProfile } from '@/lib/connectors/types'
import { decrypt, encrypt } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

const GRACE_MS = 120_000

export type ActiveYouTubeConnection = {
  accountId: string
  accessToken: string
  profile: PlatformProfile
}

export async function getActiveYouTubeConnection(
  creatorId: string
): Promise<ActiveYouTubeConnection | null> {
  const account = await prisma.connectedAccount.findFirst({
    where: { creatorId, platform: 'YOUTUBE', isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  if (!account?.accessTokenEncrypted) {
    return null
  }

  const connector = new YouTubeConnector()
  let accessToken = decrypt(account.accessTokenEncrypted)
  const refreshToken =
    account.refreshTokenEncrypted && account.refreshTokenEncrypted.length > 0
      ? decrypt(account.refreshTokenEncrypted)
      : ''

  const expiresAt = account.tokenExpiresAt.getTime()
  if (expiresAt < Date.now() + GRACE_MS) {
    if (!refreshToken) {
      throw new Error('YouTube access expired; please connect your channel again')
    }
    const tokens = await connector.refreshTokens(refreshToken)
    accessToken = tokens.accessToken
    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encrypt(tokens.refreshToken) : account.refreshTokenEncrypted,
        tokenExpiresAt: tokens.expiresAt,
        scopesGranted: tokens.scope
      }
    })
  }

  const profile = await connector.getProfile(accessToken)
  return { accountId: account.id, accessToken, profile }
}

export async function resolveChannelIdForHandle(
  accessToken: string,
  handle: string
): Promise<string | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'id')
  url.searchParams.set('forHandle', handle)

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as { items?: Array<{ id?: string }> }
  return data.items?.[0]?.id ?? null
}
