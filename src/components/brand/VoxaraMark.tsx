import Image from 'next/image'

import { cn } from '@/lib/utils'

type VoxaraMarkProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
  priority?: boolean
}

const logoSizes = { sm: 36, md: 44, lg: 56 } as const

export function VoxaraMark({
  size = 'md',
  showWordmark = false,
  className,
  priority = false
}: VoxaraMarkProps) {
  const px = logoSizes[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className='relative shrink-0 overflow-hidden rounded-full shadow-md ring-1 ring-white/20'
        style={{ width: px, height: px }}
      >
        <Image
          src='/brand/voxara-logo.png'
          alt='Voxara'
          width={px}
          height={px}
          priority={priority}
          className='h-full w-full object-cover'
        />
      </div>
      {showWordmark ? (
        <div className='min-w-0 leading-tight'>
          <p className='font-semibold tracking-tight text-brand-600' style={{ fontSize: px * 0.38 }}>
            Voxara
          </p>
          <p className='hidden text-[11px] font-normal lowercase text-surface-500 sm:block'>
            hear what your audience is really saying
          </p>
        </div>
      ) : null}
    </div>
  )
}
