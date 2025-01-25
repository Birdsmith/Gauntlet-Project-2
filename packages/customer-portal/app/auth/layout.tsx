'use client'

import { ConfigProvider, App as AntApp, theme } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <AntApp>
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              background: '#141414',
            }}
          >
            {children}
          </div>
        </AntApp>
      </ConfigProvider>
    </AntdRegistry>
  )
}
