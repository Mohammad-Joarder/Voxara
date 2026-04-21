import { z } from 'zod'

export const platformSchema = z.enum(['YOUTUBE', 'TIKTOK', 'INSTAGRAM'])

export function normalizePlatform(input: string): z.infer<typeof platformSchema> {
  return platformSchema.parse(input.toUpperCase())
}
