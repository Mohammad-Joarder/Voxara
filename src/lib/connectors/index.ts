import type { Platform } from '@prisma/client'

import type { PlatformConnector } from '@/lib/connectors/types'
import { InstagramConnector } from '@/lib/connectors/instagram'
import { TikTokConnector } from '@/lib/connectors/tiktok'
import { YouTubeConnector } from '@/lib/connectors/youtube'

const connectors: Record<Platform, PlatformConnector> = {
  YOUTUBE: new YouTubeConnector(),
  TIKTOK: new TikTokConnector(),
  INSTAGRAM: new InstagramConnector()
}

export function getPlatformConnector(platform: Platform): PlatformConnector {
  return connectors[platform]
}
