const UC_RE = /^UC[\w-]{22}$/i

export type ParsedYouTubeChannelRef =
  | { type: 'channel_id'; id: string }
  | { type: 'handle'; handle: string }
  | { type: 'empty' }
  | { type: 'invalid'; reason: string }

function normalizeChannelId(value: string): string | null {
  const s = value.trim()
  if (UC_RE.test(s)) {
    return s
  }
  return null
}

/**
 * Accepts a YouTube channel ID, /channel/UC… URL, or /@handle URL.
 */
export function parseYouTubeChannelInput(raw: string): ParsedYouTubeChannelRef {
  const s = raw.trim()
  if (!s) {
    return { type: 'empty' }
  }

  const direct = normalizeChannelId(s)
  if (direct) {
    return { type: 'channel_id', id: direct }
  }

  try {
    const withProtocol = s.includes('://') ? s : `https://${s}`
    const u = new URL(withProtocol)
    if (!u.hostname.includes('youtube.com') && !u.hostname.includes('youtu.be')) {
      return { type: 'invalid', reason: 'Use a youtube.com channel link, @handle, or channel ID' }
    }

    const path = u.pathname
    const channelPath = path.match(/\/channel\/(UC[\w-]{22})/i)
    if (channelPath) {
      return { type: 'channel_id', id: channelPath[1] }
    }

    const at = path.match(/^\/@([^/]+)/)
    if (at) {
      return { type: 'handle', handle: at[1] }
    }
  } catch {
    // fall through
  }

  if (s.startsWith('@')) {
    return { type: 'handle', handle: s.slice(1) }
  }

  return { type: 'invalid', reason: 'Could not read a channel ID or @handle from that value' }
}
