import type { Metadata } from 'next'

import { Inter } from 'next/font/google'

import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { WebVitals } from '@/components/WebVitals'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Fringe Admin',
  description: 'Admin panel for The Fringe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <WebVitals />
      </body>
    </html>
  )
}