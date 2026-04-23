import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, 'ENCRYPTION_KEY must be a 32-byte hex string'),
    YOUTUBE_CLIENT_ID: z.string().min(1).optional(),
    YOUTUBE_CLIENT_SECRET: z.string().min(1).optional(),
    YOUTUBE_REDIRECT_URI: z.string().url().optional(),
    TIKTOK_CLIENT_ID: z.string().min(1).optional(),
    TIKTOK_CLIENT_SECRET: z.string().min(1).optional(),
    TIKTOK_REDIRECT_URI: z.string().url().optional(),
    INSTAGRAM_CLIENT_ID: z.string().min(1).optional(),
    INSTAGRAM_CLIENT_SECRET: z.string().min(1).optional(),
    INSTAGRAM_REDIRECT_URI: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional()
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
    NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL')
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI,
    TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
    TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI,
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
})
