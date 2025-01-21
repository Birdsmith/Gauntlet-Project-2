'use client'

import { Inter } from 'next/font/google'
import { ConfigProvider, theme } from 'antd'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#1677ff',
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}
