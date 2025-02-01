'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button, Modal, Input, Space, App } from 'antd'
import { MessageOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons'
import { ChatService } from '../../lib/services/chat.service'
import { CRMAgent } from '../../lib/ai/agent'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { ErrorBoundary } from './ErrorBoundary'
import { UIMessage, ChatError } from '../../lib/types/chat.types'
import { Card } from 'antd'

interface ChatWidgetProps {
  chatService: ChatService
  userId: string
}

const ChatContent: React.FC<ChatWidgetProps> = ({ chatService, userId }) => {
  const { message: messageApi } = App.useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [agent, setAgent] = useState<CRMAgent | null>(null)
  const [error, setError] = useState<ChatError | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeChat = async () => {
      if (!userId) {
        setError(new Error('Authentication required'))
        return
      }

      try {
        setIsInitialized(true)
      } catch (err) {
        const chatError: ChatError =
          err instanceof Error ? err : new Error('Failed to initialize chat')
        setError(chatError)
      }
    }

    initializeChat()
  }, [userId])

  useEffect(() => {
    if (sessionId && !agent) {
      try {
        const newAgent = new CRMAgent(sessionId, chatService.supabase, chatService)
        setAgent(newAgent)
      } catch (err) {
        const chatError: ChatError =
          err instanceof Error ? err : new Error('Failed to initialize agent')
        setError(chatError)
        messageApi.error('Failed to initialize chat. Please try again.')
      }
    }
  }, [sessionId, agent, chatService, messageApi])

  const handleOpen = useCallback(async () => {
    if (!userId || !isInitialized) {
      messageApi.error('Please sign in to use the chat')
      return
    }

    try {
      if (!sessionId) {
        const session = await chatService.createSession(userId)
        setSessionId(session.id)
      }
      setIsOpen(true)
    } catch (err) {
      const chatError: ChatError =
        err instanceof Error ? err : new Error('Failed to start chat session')
      setError(chatError)
      messageApi.error('Failed to start chat session. Please try again.')
    }
  }, [sessionId, chatService, userId, isInitialized, messageApi])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (error) {
      setError(null)
      setSessionId(null)
      setAgent(null)
      setInputMessage('')
    }
  }, [error])

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || !sessionId || !agent) {
      return
    }

    const currentMessage = inputMessage.trim()
    const timestamp = new Date()

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      {
        id: timestamp.getTime().toString(),
        content: currentMessage,
        type: 'user',
        timestamp,
      },
    ])

    setInputMessage('')

    // Process with AI
    setIsProcessing(true)
    try {
      // Store message and get AI response
      await chatService.addMessage({
        sessionId,
        role: 'user',
        content: currentMessage,
      })

      const response = await agent.processMessage(currentMessage)
      const responseTimestamp = new Date()

      // Store AI response
      await chatService.addMessage({
        sessionId,
        role: 'assistant',
        content: response,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: responseTimestamp.getTime().toString(),
          content: response,
          type: 'assistant',
          timestamp: responseTimestamp,
        },
      ])
    } catch (err) {
      const chatError: ChatError =
        err instanceof Error ? err : new Error('Failed to process message')
      setError(chatError)

      const errorTimestamp = new Date()
      // Update messages to show error state
      setMessages((prev) => [
        ...prev,
        {
          id: errorTimestamp.getTime().toString(),
          content:
            'I apologize, but I encountered an error processing your request. Please try again.',
          type: 'assistant',
          timestamp: errorTimestamp,
          isError: true,
        },
      ])

      // Show error message to user
      messageApi.error('Failed to process message. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [inputMessage, sessionId, agent, chatService, messageApi])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  if (error) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <p>Failed to initialize chat. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    )
  }

  return (
    <>
      <Button
        type="primary"
        icon={<MessageOutlined />}
        onClick={handleOpen}
        size="large"
        className="chat-widget-button"
      >
        Chat with AI
      </Button>

      <Modal
        title="Customer Support"
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        width={400}
        styles={{
          body: {
            height: 500,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        closeIcon={<CloseOutlined />}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: msg.isError
                  ? '#fff2f0'
                  : msg.type === 'user'
                    ? '#1677ff'
                    : '#f0f0f0',
                color: msg.type === 'user' ? 'white' : 'black',
                border: msg.isError ? '1px solid #ffccc7' : 'none',
              }}
            >
              {msg.content}
              <div
                style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  marginTop: '4px',
                }}
              >
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isProcessing && <ChatTypingIndicator />}
        </div>

        <Space.Compact style={{ marginTop: '16px' }}>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputMessage.trim() || isProcessing}
          />
        </Space.Compact>
      </Modal>
    </>
  )
}

export const ChatWidget: React.FC<ChatWidgetProps> = (props) => (
  <App>
    <ErrorBoundary>
      <ChatContent {...props} />
    </ErrorBoundary>
  </App>
)
