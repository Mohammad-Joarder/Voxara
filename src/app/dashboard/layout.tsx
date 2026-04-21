'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type CreatorSummary = {
  displayName: string
  avatarUrl: string | null
}

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/sentiment', label: 'Sentiment' },
  { href: '/dashboard/cta-insights', label: 'CTA Insights' },
  { href: '/dashboard/purchase-intent', label: 'Purchase Intent' },
  { href: '/dashboard/content', label: 'Content' },
  { href: '/dashboard/recommendations', label: 'AI Recommendations' },
  { href: '/dashboard/settings', label: 'Settings' }
]

function NavIcon() {
  return (
    <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 4v12h14V7H5zm2 2h4v4H7V9zm6 0h4v2h-4V9zm0 4h4v2h-4v-2z' />
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [creator, setCreator] = useState<CreatorSummary | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    const loadHeaderData = async () => {
      const creatorResponse = await fetch('/api/creators/me', { cache: 'no-store' })
      if (creatorResponse.ok) {
        const payload = (await creatorResponse.json()) as {
          data: { creator: CreatorSummary }
        }
        setCreator(payload.data.creator)
      }

      const alertsResponse = await fetch('/api/alerts', { cache: 'no-store' })
      if (alertsResponse.ok) {
        const payload = (await alertsResponse.json()) as { data: Array<{ id: string }> }
        setUnreadCount(payload.data.length)
      }
    }
    void loadHeaderData()
  }, [pathname])

  const pageTitle = useMemo(() => {
    const matched = navItems.find((item) => pathname === item.href)
    if (matched) {
      return matched.label
    }
    if (pathname.startsWith('/dashboard/settings')) {
      return 'Settings'
    }
    return 'Dashboard'
  }, [pathname])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className='flex min-h-screen bg-surface-50'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-surface-200 bg-white p-4 transition md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='mb-6 text-lg font-semibold text-brand-700'>Voxara</div>
        <nav className='space-y-1'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                pathname === item.href
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-surface-600 hover:bg-surface-100'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <NavIcon />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className='mt-10 rounded-lg border border-surface-200 p-3'>
          <div className='mb-3 flex items-center gap-2'>
            <div className='h-8 w-8 overflow-hidden rounded-full bg-surface-200'>
              {creator?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatarUrl} alt='Creator avatar' className='h-full w-full object-cover' />
              ) : null}
            </div>
            <p className='text-sm font-medium text-surface-800'>
              {creator?.displayName ?? 'Loading...'}
            </p>
          </div>
          <Button variant='ghost' size='sm' onClick={signOut}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className='flex min-h-screen flex-1 flex-col md:ml-0'>
        <header className='sticky top-0 z-30 flex items-center justify-between border-b border-surface-200 bg-white px-4 py-3 md:px-6'>
          <div className='flex items-center gap-2'>
            <button
              className='rounded-lg border border-surface-200 p-2 md:hidden'
              onClick={() => setMobileOpen((open) => !open)}
            >
              ☰
            </button>
            <h1 className='text-lg font-semibold text-surface-900'>{pageTitle}</h1>
          </div>
          <Link href='/dashboard/alerts' className='relative rounded-full border border-surface-200 p-2'>
            <span aria-hidden='true'>🔔</span>
            {unreadCount > 0 ? (
              <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white'>
                {unreadCount}
              </span>
            ) : null}
          </Link>
        </header>
        <main className='flex-1 overflow-y-auto p-4 md:p-6'>{children}</main>
      </div>
    </div>
  )
}
