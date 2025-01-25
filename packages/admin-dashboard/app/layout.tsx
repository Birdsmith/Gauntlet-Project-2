'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import AntdRegistry from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AutoCRM Admin Portal',
  description: 'Admin management system for AutoCRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
