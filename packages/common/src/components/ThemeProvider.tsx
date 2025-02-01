'use client'

import { ConfigProvider, theme, App } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

export interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1677ff',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
