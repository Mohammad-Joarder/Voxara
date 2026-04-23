import { getInstagramOAuth } from '@/lib/connectors/oauth-env'
import type { OAuthTokens, PlatformConnector, PlatformProfile } from '@/lib/connectors/types'

const AUTH_URL = 'https://api.instagram.com/oauth/authorize'
const TOKEN_URL = 'https://api.instagram.com/oauth/access_token'
const LONG_LIVED_URL = 'https://graph.instagram.com/access_token'
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token'
const PROFILE_URL = 'https://graph.instagram.com/me?fields=id,username,account_type,media_count'
const REVOKE_URL = 'https://graph.instagram.com/me/permissions'
const SCOPES = ['instagram_basic', 'instagram_manage_comments', 'pages_read_engagement']

type InstagramShortTokenResponse = {
  access_token: string
  user_id: number
}

type InstagramLongTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

type InstagramProfileResponse = {
  id: string
  username: string
  account_type?: string
  media_count?: number
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text()
  return `Instagram API error (${response.status}): ${text || response.statusText}`
}

export class InstagramConnector implements PlatformConnector {
  getAuthUrl(state: string): string {
    const o = getInstagramOAuth()
    const params = new URLSearchParams({
      client_id: o.clientId,
      redirect_uri: o.redirectUri,
      response_type: 'code',
      scope: SCOPES.join(','),
      state
    })

    return `${AUTH_URL}?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const o = getInstagramOAuth()
    const shortTokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: o.clientId,
        client_secret: o.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: o.redirectUri,
        code
      })
    })

    if (!shortTokenResponse.ok) {
      throw new Error(await parseError(shortTokenResponse))
    }

    const shortToken = (await shortTokenResponse.json()) as InstagramShortTokenResponse
    const longTokenResponse = await fetch(
      `${LONG_LIVED_URL}?${new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: o.clientSecret,
        access_token: shortToken.access_token
      }).toString()}`
    )

    if (!longTokenResponse.ok) {
      throw new Error(await parseError(longTokenResponse))
    }

    const longToken = (await longTokenResponse.json()) as InstagramLongTokenResponse
    return {
      accessToken: longToken.access_token,
      refreshToken: longToken.access_token,
      expiresAt: new Date(Date.now() + longToken.expires_in * 1000),
      scope: SCOPES
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(
      `${REFRESH_URL}?${new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: refreshToken
      }).toString()}`
    )

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const refreshed = (await response.json()) as InstagramLongTokenResponse
    return {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.access_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      scope: SCOPES
    }
  }

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    const response = await fetch(`${PROFILE_URL}&access_token=${encodeURIComponent(accessToken)}`)
    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as InstagramProfileResponse
    return {
      platformUserId: data.id,
      platformUsername: data.username,
      displayName: data.username,
      followerCount: data.media_count ?? 0,
      channelName: data.username
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    const response = await fetch(REVOKE_URL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }
  }
}
