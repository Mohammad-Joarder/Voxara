export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string[]
}

export interface PlatformProfile {
  platformUserId: string
  platformUsername: string
  displayName: string
  followerCount: number
  channelName: string
  avatarUrl?: string
}

export interface PlatformConnector {
  getAuthUrl(state: string): string
  exchangeCode(code: string): Promise<OAuthTokens>
  refreshTokens(refreshToken: string): Promise<OAuthTokens>
  getProfile(accessToken: string): Promise<PlatformProfile>
  revokeToken(accessToken: string): Promise<void>
}
