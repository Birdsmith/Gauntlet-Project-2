import { Database } from './database.types'

export type Json = Database['public']['Tables']['chat_messages']['Row']['metadata']

export type ChatMessageRole = Database['public']['Enums']['chat_message_type']
export type ChatSessionStatus = Database['public']['Enums']['chat_session_status']

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool'
  content: string
  type?: 'text' | 'error' | 'loading'
  metadata: Record<string, any>
  createdAt: Date
}

export interface UIMessage {
  id: string
  content: string
  type: 'user' | 'assistant'
  timestamp: Date
  isError?: boolean
}

export interface ChatError extends Error {
  code?: string
  details?: unknown
}

export interface ChatSession {
  id: string
  title: string
  createdBy: string
  metadata: Record<string, any> | null
  status: ChatSessionStatus
  ticketId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CRMAction {
  id: string
  sessionId: string
  actionType: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high'
  ticketId?: string
  description?: string
  assignedTo?: string
  dueDate?: Date
  metadata: Record<string, any>
  createdAt: Date
}
