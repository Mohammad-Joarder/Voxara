import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/env'

const PUBLIC_PATHS = new Set(['/', '/login', '/privacy', '/terms'])

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/onboarding')
}

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

function isUnprotectedApi(pathname: string) {
  return pathname.startsWith('/api/auth/callback/') || pathname === '/api/health'
}

function isProtectedDashboard(pathname: string) {
  return pathname.startsWith('/dashboard')
}

async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...(options as Parameters<typeof response.cookies.set>[0])
          })
          response = NextResponse.next({ request })
          response.cookies.set({
            name,
            value,
            ...(options as Parameters<typeof response.cookies.set>[0])
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...(options as Parameters<typeof response.cookies.set>[0]),
            maxAge: 0
          })
          response = NextResponse.next({ request })
          response.cookies.set({
            name,
            value: '',
            ...(options as Parameters<typeof response.cookies.set>[0]),
            maxAge: 0
          })
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  return { user, response }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const { user, response } = await updateSession(request)

  const protectedApi = isApiPath(pathname) && !isUnprotectedApi(pathname)
  const protectedPage = isProtectedDashboard(pathname)
  const publicPage = isPublicPath(pathname)

  if ((protectedApi || protectedPage) && !user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (!publicPage && !protectedApi && !protectedPage) {
    return response
  }

  if (user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-creator-id', user.id)
    const enrichedResponse = NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
    response.cookies.getAll().forEach((cookie) => {
      enrichedResponse.cookies.set(cookie)
    })
    return enrichedResponse
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
