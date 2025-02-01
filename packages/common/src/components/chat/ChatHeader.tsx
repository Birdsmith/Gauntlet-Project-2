'use client'

import { Button, Typography } from 'antd'
import { MinusOutlined, ExpandOutlined, CloseOutlined } from '@ant-design/icons'

const { Title } = Typography

export interface ChatHeaderProps {
  onClose?: () => void
  onMinimize?: () => void
  isMinimized?: boolean
}

export function ChatHeader({ onClose, onMinimize, isMinimized }: ChatHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        padding: '0 16px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          AutoCRM Assistant
        </Title>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          type="text"
          icon={isMinimized ? <ExpandOutlined /> : <MinusOutlined />}
          onClick={onMinimize}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
        />

        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close chat"
        />
      </div>
    </div>
  )
}
