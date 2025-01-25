'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import AntdRegistry from './providers'

const inter = Inter({ subsets: ['latin'] })

interface LayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
