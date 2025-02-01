'use client'

import { LoadingOutlined, RobotOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'

export function ChatTypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16 }}>
      <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 8,
          backgroundColor: '#f5f5f5',
        }}
      >
        <LoadingOutlined style={{ color: '#8c8c8c' }} />
        <span style={{ fontSize: 14, color: '#8c8c8c' }}>AutoCRM is thinking...</span>
      </div>
    </div>
  )
}
