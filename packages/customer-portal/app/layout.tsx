import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './providers'

const inter = Inter({ subsets: ['latin'] })

interface LayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
