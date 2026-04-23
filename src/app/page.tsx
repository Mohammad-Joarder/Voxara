import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <main className='mx-auto flex min-h-screen max-w-5xl items-center justify-center bg-gradient-to-b from-surface-50 to-surface-100/90 px-4 py-12'>
      <Card className='w-full max-w-2xl overflow-hidden border-surface-200/80 shadow-soft' padding='none'>
        <div className='bg-gradient-to-r from-brand-600/5 via-white to-accent-500/5 px-8 py-8 md:px-10 md:py-10'>
          <div className='mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center'>
            <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-200 shadow-md'>
              <Image
                src='/brand/voxara-logo.png'
                alt='Voxara'
                width={64}
                height={64}
                className='h-full w-full object-cover'
                priority
              />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-brand-600 md:text-4xl'>Voxara</h1>
              <p className='mt-1 text-sm font-normal lowercase text-surface-500'>
                hear what your audience is really saying
              </p>
            </div>
          </div>
          <p className='text-base leading-relaxed text-surface-600 md:text-lg'>
            Turn social comments into clear, actionable insight across sentiment, CTAs, and purchase intent. Built
            for creators who want data without the noise.
          </p>
        </div>
        <div className='border-t border-surface-200 bg-surface-50/50 px-8 py-6 md:px-10'>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Link href='/login' className='sm:flex-1'>
              <Button variant='accent' className='w-full' size='lg' type='button'>
                Get started
              </Button>
            </Link>
            <Link href='/privacy' className='sm:flex-1'>
              <Button variant='secondary' className='w-full' size='lg' type='button'>
                Privacy
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  )
}
