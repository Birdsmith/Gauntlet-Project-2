import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import { ChatMessage, ChatSession, CRMAction, Json } from '../types/chat.types'
import { Logger } from '../utils/logger'

const errorToJson = (error: unknown): Json => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { message: String(error) }
}

export class ChatService {
  private supabaseClient: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabaseClient = supabase
  }

  get supabase() {
    return this.supabaseClient
  }

  async createSession(userId: string): Promise<ChatSession> {
    try {
      const insertData: Database['public']['Tables']['chat_sessions']['Insert'] = {
        created_by: userId,
        title: 'New Chat Session',
        status: 'active',
        metadata: null,
      }

      const { data, error } = await this.supabaseClient
        .from('chat_sessions')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        Logger.error('Supabase error creating chat session', {
          category: 'Chat',
          metadata: { error: errorToJson(error), userId, insertData },
        })
        throw error
      }

      if (!data) {
        throw new Error('No data returned from chat session creation')
      }

      Logger.info('Created new chat session', {
        category: 'Chat',
        sessionId: data.id,
        metadata: { userId },
      })

      return {
        id: data.id,
        title: data.title,
        createdBy: data.created_by,
        status: data.status,
        metadata: data.metadata as Json,
        ticketId: data.ticket_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      Logger.error('Failed to create chat session', {
        category: 'Chat',
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  async addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    try {
      const { data, error } = await this.supabaseClient
        .from('chat_messages')
        .insert([
          {
            session_id: message.sessionId,
            message_type: message.role,
            content: message.content,
            metadata: message.metadata || {},
          },
        ])
        .select()
        .single()

      if (error) throw error

      Logger.info('Added chat message', {
        category: 'Chat',
        sessionId: message.sessionId,
        metadata: { messageId: data.id },
      })

      return {
        id: data.id,
        sessionId: data.session_id,
        role: data.message_type,
        content: data.content,
        metadata: data.metadata as Json,
        createdAt: new Date(data.created_at),
      }
    } catch (error) {
      Logger.error('Failed to add chat message', {
        category: 'Chat',
        sessionId: message.sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data.map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        role: msg.message_type,
        content: msg.content,
        metadata: msg.metadata as Json,
        createdAt: new Date(msg.created_at),
      }))
    } catch (error) {
      Logger.error('Failed to get chat messages', {
        category: 'Chat',
        sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const { data, error } = await this.supabaseClient
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        createdBy: data.created_by,
        status: data.status,
        metadata: data.metadata as Json,
        ticketId: data.ticket_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      Logger.error('Failed to get chat session', {
        category: 'Chat',
        sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  async updateSession(
    sessionId: string,
    updates: Partial<Omit<ChatSession, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<ChatSession> {
    try {
      const { data, error } = await this.supabaseClient
        .from('chat_sessions')
        .update({
          status: updates.status,
          metadata: updates.metadata,
          title: updates.title,
          ticket_id: updates.ticketId,
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error

      Logger.info('Updated chat session', {
        category: 'Chat',
        sessionId,
        metadata: { updates },
      })

      return {
        id: data.id,
        title: data.title,
        createdBy: data.created_by,
        status: data.status,
        metadata: data.metadata as Json,
        ticketId: data.ticket_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      Logger.error('Failed to update chat session', {
        category: 'Chat',
        sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  async createAction(action: Omit<CRMAction, 'id' | 'createdAt'>): Promise<CRMAction> {
    try {
      const metadata = {
        sessionId: action.sessionId,
        ...((action.metadata as Record<string, unknown>) || {}),
      }

      const { data, error } = await this.supabaseClient
        .from('crm_actions')
        .insert([
          {
            action_type: action.actionType as Database['public']['Enums']['crm_action_type'],
            title: `${action.actionType} - ${action.description || 'No description'}`,
            created_by: action.assignedTo || '', // Required field
            status: action.status as Database['public']['Enums']['crm_action_status'],
            ticket_id: action.ticketId,
            description: action.description,
            assigned_to: action.assignedTo,
            due_date: action.dueDate?.toISOString(),
            metadata: metadata as Json,
          },
        ])
        .select()
        .single()

      if (error) throw error

      Logger.info('Created CRM action', {
        category: 'Action',
        metadata: {
          actionType: action.actionType,
          status: action.status,
        },
      })

      const responseMetadata = data.metadata as { sessionId: string } & Record<string, unknown>

      return {
        id: data.id,
        sessionId: responseMetadata.sessionId,
        actionType: data.action_type,
        status: data.status as CRMAction['status'],
        priority: 'normal', // Default priority since it's not in the database schema
        ticketId: data.ticket_id || undefined,
        description: data.description || undefined,
        assignedTo: data.assigned_to || undefined,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        metadata: data.metadata as Json,
        createdAt: new Date(data.created_at),
      }
    } catch (error) {
      Logger.error('Failed to create CRM action', {
        category: 'Action',
        metadata: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error
    }
  }
}
