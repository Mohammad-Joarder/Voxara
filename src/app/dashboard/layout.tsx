'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'

type CreatorSummary = {
  displayName: string
  avatarUrl: string | null
  consentAiAnalysis: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/sentiment', label: 'Sentiment' },
  { href: '/dashboard/cta-insights', label: 'CTA Insights' },
  { href: '/dashboard/purchase-intent', label: 'Purchase Intent' },
  { href: '/dashboard/content', label: 'Content' },
  { href: '/dashboard/recommendations', label: 'AI Recommendations' },
  { href: '/dashboard/integrations', label: 'Integrations' },
  { href: '/dashboard/settings', label: 'Settings' }
]

function NavIcon() {
  return (
    <svg className='h-4 w-4 opacity-90' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
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
        if (!payload.data.creator.consentAiAnalysis) {
          router.replace('/onboarding')
          return
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
  }, [pathname, router])

  const pageTitle = useMemo(() => {
    const matched = navItems.find((item) => pathname === item.href)
    if (matched) {
      return matched.label
    }
    if (pathname.startsWith('/dashboard/settings')) {
      return 'Settings'
    }
    if (pathname.startsWith('/dashboard/accounts')) {
      return 'Accounts'
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
          'fixed inset-y-0 left-0 z-40 flex min-h-screen w-64 flex-col border-r border-brand-800/30 bg-gradient-to-b from-brand-600 to-brand-800 text-white shadow-lg transition md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='shrink-0 border-b border-white/10 px-4 py-5'>
          <Link href='/dashboard' className='flex items-center gap-3' onClick={() => setMobileOpen(false)}>
            <div className='relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/25'>
              <Image
                src='/brand/voxara-logo.png'
                alt='Voxara'
                width={40}
                height={40}
                className='h-full w-full object-cover'
                priority
              />
            </div>
            <div className='min-w-0 leading-tight'>
              <p className='text-sm font-semibold tracking-tight'>Voxara</p>
              <p className='truncate text-[10px] font-normal lowercase text-white/70'>Hear what your audience says</p>
            </div>
          </Link>
        </div>
        <nav className='min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-4'>
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'border-l-2 border-accent-500 bg-white/10 text-white shadow-sm'
                    : 'border-l-2 border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                )}
                onClick={() => setMobileOpen(false)}
              >
                <NavIcon />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className='shrink-0 border-t border-white/10 p-4'>
          <div className='mb-3 flex items-center gap-2'>
            <div className='h-9 w-9 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/30'>
              {creator?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatarUrl} alt='' className='h-full w-full object-cover' />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-xs font-medium text-white/80'>
                  {(creator?.displayName ?? '?').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <p className='min-w-0 flex-1 truncate text-sm text-white/95'>{creator?.displayName ?? '…'}</p>
          </div>
          <Button
            variant='secondary'
            size='sm'
            className='w-full border border-white/20 bg-white/10 text-white hover:bg-white/20'
            onClick={signOut}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className='flex min-h-screen flex-1 flex-col md:ml-0'>
        <header className='sticky top-0 z-30 flex items-center justify-between border-b border-surface-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              className='rounded-lg border border-surface-200 bg-white p-2 text-surface-700 shadow-sm md:hidden'
              onClick={() => setMobileOpen((open) => !open)}
              aria-label='Open menu'
            >
              <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
            <h1 className='text-lg font-semibold tracking-tight text-brand-600'>{pageTitle}</h1>
          </div>
          <Link
            href='/dashboard/alerts'
            className='relative flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white text-lg shadow-sm transition hover:border-brand-200'
            aria-label='Alerts'
          >
            <span aria-hidden>🔔</span>
            {unreadCount > 0 ? (
              <span className='absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white'>
                {unreadCount}
              </span>
            ) : null}
          </Link>
        </header>
        <main className='flex-1 overflow-y-auto p-4 md:p-8'>{children}</main>
      </div>
    </div>
  )
}
