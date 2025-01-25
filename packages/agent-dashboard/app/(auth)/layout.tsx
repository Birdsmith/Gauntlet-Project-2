'use client'

import { ConfigProvider, theme, App } from 'antd'
import '../globals.css'
import AntdRegistry from '../providers'

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
            colorPrimary: '#1668dc',
            colorBgBase: '#141414',
            colorBgContainer: '#1f1f1f',
            borderRadius: 4,
          },
        }}
      >
        <App>
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'var(--background-dark)',
            }}
          >
            {children}
          </div>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
