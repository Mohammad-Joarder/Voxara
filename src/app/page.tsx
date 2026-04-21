import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <main className='mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12'>
      <Card className='w-full max-w-2xl' padding='lg'>
        <h1 className='text-3xl font-semibold text-surface-900'>Voxara</h1>
        <p className='mt-3 text-surface-600'>
          Turn social comments into actionable AI insights across sentiment, CTA opportunities, and
          purchase intent.
        </p>
        <div className='mt-8 flex gap-3'>
          <Link href='/login'>
            <Button>Get Started</Button>
          </Link>
          <Link href='/privacy'>
            <Button variant='secondary'>Privacy</Button>
          </Link>
        </div>
      </Card>
    </main>
  )
}
