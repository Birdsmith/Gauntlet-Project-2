'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from '../../lib/types/chat.types'
import { Avatar } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'

export interface ChatMessagesProps {
  messages: ChatMessage[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        overflowY: 'auto',
        padding: 16,
      }}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
          }}
        >
          <Avatar
            icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
            }}
          />

          <div
            style={{
              maxWidth: '80%',
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: message.type === 'user' ? '#1890ff' : '#f5f5f5',
              color: message.type === 'user' ? '#fff' : '#000',
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
