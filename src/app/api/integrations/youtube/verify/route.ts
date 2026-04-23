import { z } from 'zod'

import { fail, ok } from '@/lib/api'
import { requireAuthUser } from '@/lib/auth'
import { parseYouTubeChannelInput } from '@/lib/youtube-channel-parse'
import { getActiveYouTubeConnection, resolveChannelIdForHandle } from '@/lib/youtube-connection'

const bodySchema = z.object({
  channelUrlOrId: z.string().optional()
})

/**
 * Verifies the stored YouTube OAuth connection by calling the Data API.
 * Optionally checks that the connected channel matches a URL, ID, or @handle the user entered before connecting.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuthUser()
    if (!user) {
      return fail('Authentication required', 'UNAUTHORIZED', 401)
    }

    let channelUrlOrId: string | undefined
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const json = (await request.json()) as unknown
      const parsed = bodySchema.safeParse(json)
      if (!parsed.success) {
        return fail('Invalid request body', 'VALIDATION_ERROR', 400)
      }
      channelUrlOrId = parsed.data.channelUrlOrId
    }

    const connection = await getActiveYouTubeConnection(user.id)
    if (!connection) {
      return ok({
        connected: false,
        message: 'No YouTube account connected for this workspace.',
        channel: null,
        expectedMatch: null
      })
    }

    const { profile, accessToken } = connection
    let expectedMatch: boolean | null = null

    if (channelUrlOrId && channelUrlOrId.trim()) {
      const ref = parseYouTubeChannelInput(channelUrlOrId)
      if (ref.type === 'invalid') {
        return fail(ref.reason, 'VALIDATION_ERROR', 400)
      }
      if (ref.type === 'empty') {
        expectedMatch = null
      } else if (ref.type === 'channel_id') {
        expectedMatch = ref.id === profile.platformUserId
      } else {
        const resolved = await resolveChannelIdForHandle(accessToken, ref.handle)
        expectedMatch = resolved !== null && resolved === profile.platformUserId
      }
    }

    return ok({
      connected: true,
      message: 'YouTube API responded successfully for your connected account.',
      channel: {
        id: profile.platformUserId,
        title: profile.displayName,
        handle: profile.platformUsername,
        subscriberCount: profile.followerCount
      },
      expectedMatch
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify YouTube connection'
    return fail(message, 'YOUTUBE_VERIFY_ERROR', 500)
  }
}
