'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Input, Button, Space } from 'antd'
import { SendOutlined, AudioOutlined } from '@ant-design/icons'

export interface ChatInputProps {
  onSend: (content: string) => void
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceToggle = () => {
    // TODO: Implement voice recording
    setIsRecording(!isRecording)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <Input.TextArea
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{ flex: 1, resize: 'none', borderRadius: 8 }}
      />

      <Space>
        <Button
          type="text"
          icon={<AudioOutlined style={{ color: isRecording ? '#ff4d4f' : undefined }} />}
          onClick={handleVoiceToggle}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!message.trim()}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Send message"
        />
      </Space>
    </div>
  )
}
