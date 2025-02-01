'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button, Layout } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { ChatMessage } from '../../lib/types/chat.types'
import { ChatService } from '../../lib/services/chat.service'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../lib/types/database.types'
import { CRMAgent } from '../../lib/ai/agent'

const { Sider } = Layout

export interface ChatSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  sessionId?: string
  supabase: SupabaseClient<Database>
}

export function ChatSidebar({ isOpen = false, onClose, sessionId, supabase }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const chatService = useMemo(() => new ChatService(supabase), [supabase])
  const [agent, setAgent] = useState<CRMAgent | null>(null)

  // Initialize agent when session is available
  useEffect(() => {
    if (sessionId && !agent) {
      const newAgent = new CRMAgent(sessionId, supabase, chatService)
      setAgent(newAgent)
    }
  }, [sessionId, supabase, chatService, agent])

  // Load initial messages
  useEffect(() => {
    if (sessionId) {
      chatService.getMessages(sessionId).then(setMessages)
    }
  }, [sessionId, chatService])

  // Set up realtime subscription
  useEffect(() => {
    if (!sessionId) return

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            sessionId: payload.new.session_id,
            role: payload.new.role,
            content: payload.new.content,
            metadata: payload.new.metadata,
            createdAt: new Date(payload.new.created_at),
          }
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, chatService])

  const handleSend = async (content: string) => {
    if (!sessionId || !agent) return

    setIsTyping(true)
    try {
      // Store user message
      await chatService.addMessage({
        sessionId,
        content,
        role: 'user',
      })

      // Process with AI
      const response = await agent.processMessage(content)

      // Store assistant message
      await chatService.addMessage({
        sessionId,
        content: response,
        role: 'assistant',
      })
    } catch (error) {
      console.error('Error processing message:', error)

      // Store error message
      await chatService.addMessage({
        sessionId,
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        role: 'assistant',
        metadata: { isError: true },
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  if (!isOpen) {
    return (
      <Button
        type="primary"
        icon={<MessageOutlined />}
        onClick={onClose}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: '50%',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      />
    )
  }

  return (
    <Sider
      width={384}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: isMinimized ? 64 : '100%',
        background: '#fff',
        zIndex: 1000,
        boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
        transition: 'height 0.3s',
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChatHeader onClose={onClose} onMinimize={handleToggleMinimize} isMinimized={isMinimized} />

        {!isMinimized && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatMessages messages={messages} />
              {isTyping && <ChatTypingIndicator />}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', padding: 16 }}>
              <ChatInput onSend={handleSend} />
            </div>
          </>
        )}
      </div>
    </Sider>
  )
}
