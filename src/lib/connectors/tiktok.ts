import { getTikTokOAuth } from '@/lib/connectors/oauth-env'
import type { OAuthTokens, PlatformConnector, PlatformProfile } from '@/lib/connectors/types'

const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const PROFILE_URL = 'https://open.tiktokapis.com/v2/user/info/'
const REVOKE_URL = 'https://open.tiktokapis.com/v2/oauth/revoke/'
const SCOPES = ['user.info.basic', 'video.list', 'comment.list']

type TikTokTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}

type TikTokProfileResponse = {
  data?: {
    user?: {
      open_id: string
      username?: string
      display_name?: string
      avatar_url?: string
      follower_count?: number
    }
  }
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text()
  return `TikTok API error (${response.status}): ${text || response.statusText}`
}

export class TikTokConnector implements PlatformConnector {
  getAuthUrl(state: string): string {
    const o = getTikTokOAuth()
    const params = new URLSearchParams({
      client_key: o.clientKey,
      redirect_uri: o.redirectUri,
      response_type: 'code',
      scope: SCOPES.join(','),
      state
    })

    return `${AUTH_URL}?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const o = getTikTokOAuth()
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: o.clientKey,
        client_secret: o.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: o.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const tokens = (await response.json()) as TikTokTokenResponse
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope?.split(',') ?? SCOPES
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const o = getTikTokOAuth()
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: o.clientKey,
        client_secret: o.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const tokens = (await response.json()) as TikTokTokenResponse
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope?.split(',') ?? SCOPES
    }
  }

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    const response = await fetch(PROFILE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: ['open_id', 'username', 'display_name', 'avatar_url', 'follower_count']
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as TikTokProfileResponse
    const user = data.data?.user
    if (!user) {
      throw new Error('TikTok profile not found for authenticated user')
    }

    return {
      platformUserId: user.open_id,
      platformUsername: user.username ?? user.open_id,
      displayName: user.display_name ?? user.username ?? user.open_id,
      followerCount: user.follower_count ?? 0,
      channelName: user.display_name ?? user.username ?? 'TikTok account',
      avatarUrl: user.avatar_url
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    const o = getTikTokOAuth()
    const response = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: o.clientKey,
        client_secret: o.clientSecret,
        token: accessToken
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }
  }
}
