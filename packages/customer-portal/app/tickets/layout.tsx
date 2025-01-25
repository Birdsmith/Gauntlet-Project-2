'use client'

import { App } from 'antd'

interface TicketsLayoutProps {
  children: React.ReactNode
}

export default function TicketsLayout({ children }: TicketsLayoutProps) {
  return (
    <App>
      <div style={{ padding: '24px' }}>{children}</div>
    </App>
  )
}
