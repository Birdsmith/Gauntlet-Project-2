'use client'

import { useState } from 'react'
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs'
import { useServerInsertedHTML } from 'next/navigation'
import { ConfigProvider, theme, App } from 'antd'
import { AgentChat } from '../src/components/AgentChat'

export default function AntdRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [cache] = useState(() => createCache())

  useServerInsertedHTML(() => {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `</script>${extractStyle(cache)}<script>`,
        }}
      />
    )
  })

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <App>
          {children}
          <AgentChat />
        </App>
      </ConfigProvider>
    </StyleProvider>
  )
}
