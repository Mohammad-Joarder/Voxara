import { env } from '@/env'

function missingOAuth(platform: string): Error {
  return new Error(
    `${platform} OAuth is not configured. Set the client ID, secret, and redirect URI in your environment.`
  )
}

export function getYouTubeOAuth() {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI } = env
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REDIRECT_URI) {
    throw missingOAuth('YouTube')
  }
  return {
    clientId: YOUTUBE_CLIENT_ID,
    clientSecret: YOUTUBE_CLIENT_SECRET,
    redirectUri: YOUTUBE_REDIRECT_URI
  }
}

export function getTikTokOAuth() {
  const { TIKTOK_CLIENT_ID, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI } = env
  if (!TIKTOK_CLIENT_ID || !TIKTOK_CLIENT_SECRET || !TIKTOK_REDIRECT_URI) {
    throw missingOAuth('TikTok')
  }
  return {
    clientKey: TIKTOK_CLIENT_ID,
    clientSecret: TIKTOK_CLIENT_SECRET,
    redirectUri: TIKTOK_REDIRECT_URI
  }
}

export function getInstagramOAuth() {
  const { INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI } = env
  if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET || !INSTAGRAM_REDIRECT_URI) {
    throw missingOAuth('Instagram')
  }
  return {
    clientId: INSTAGRAM_CLIENT_ID,
    clientSecret: INSTAGRAM_CLIENT_SECRET,
    redirectUri: INSTAGRAM_REDIRECT_URI
  }
}
