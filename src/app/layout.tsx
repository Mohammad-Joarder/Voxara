import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import '@/app/globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Voxara',
  description: 'AI influencer analytics SaaS platform',
  icons: { icon: '/brand/voxara-logo.png', apple: '/brand/voxara-logo.png' }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
