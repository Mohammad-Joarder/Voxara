import { env } from '@/env'
import type { OAuthTokens, PlatformConnector, PlatformProfile } from '@/lib/connectors/types'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const PROFILE_URL =
  'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly'
]

type YouTubeTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
}

type YouTubeProfileResponse = {
  items?: Array<{
    id: string
    snippet: {
      title: string
      customUrl?: string
      thumbnails?: { default?: { url?: string } }
    }
    statistics?: {
      subscriberCount?: string
    }
  }>
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text()
  return `YouTube API error (${response.status}): ${text || response.statusText}`
}

export class YouTubeConnector implements PlatformConnector {
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      redirect_uri: env.YOUTUBE_REDIRECT_URI,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES.join(' '),
      state
    })

    return `${AUTH_URL}?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: env.YOUTUBE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const tokens = (await response.json()) as YouTubeTokenResponse
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope.split(' ')
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const tokens = (await response.json()) as YouTubeTokenResponse
    return {
      accessToken: tokens.access_token,
      refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope.split(' ')
    }
  }

  async getProfile(accessToken: string): Promise<PlatformProfile> {
    const response = await fetch(PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as YouTubeProfileResponse
    const channel = data.items?.[0]
    if (!channel) {
      throw new Error('YouTube profile not found for authenticated user')
    }

    const followerCount = Number.parseInt(channel.statistics?.subscriberCount ?? '0', 10)

    return {
      platformUserId: channel.id,
      platformUsername: channel.snippet.customUrl ?? channel.id,
      displayName: channel.snippet.title,
      followerCount: Number.isFinite(followerCount) ? followerCount : 0,
      channelName: channel.snippet.title,
      avatarUrl: channel.snippet.thumbnails?.default?.url
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    const response = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: accessToken })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }
  }
}
