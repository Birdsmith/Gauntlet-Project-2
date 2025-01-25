'use client'

import { ConfigProvider, theme } from 'antd'
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
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}
