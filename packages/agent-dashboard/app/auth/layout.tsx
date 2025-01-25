'use client'

import { ConfigProvider, App as AntApp, theme } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
