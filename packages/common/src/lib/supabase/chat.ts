import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import { ChatMessage, ChatSession, CRMAction, Json } from '../types/chat.types'

type DbChatSession = Database['public']['Tables']['chat_sessions']['Insert']
type DbChatMessage = Database['public']['Tables']['chat_messages']['Insert']
type DbCRMAction = Database['public']['Tables']['crm_actions']['Insert']
type DbChatSessionRow = Database['public']['Tables']['chat_sessions']['Row']
type DbChatMessageRow = Database['public']['Tables']['chat_messages']['Row']
type DbCRMActionRow = Database['public']['Tables']['crm_actions']['Row']

export class ChatService {
  constructor(public readonly supabase: SupabaseClient<Database>) {}

  async createSession(title: string, createdBy: string): Promise<ChatSession> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .insert({
        title,
        created_by: createdBy,
        status: 'active',
      } satisfies DbChatSession)
      .select()
      .single()

    if (error) throw error
    return this.mapSessionResponse(data)
  }

  async storeMessage(message: {
    sessionId: string
    content: string
    type: ChatMessage['type']
    metadata?: Json
  }): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        session_id: message.sessionId,
        content: message.content,
        message_type: message.type,
        metadata: message.metadata || null,
      } satisfies DbChatMessage)
      .select()
      .single()

    if (error) throw error
    return this.mapMessageResponse(data)
  }

  async trackAction(action: {
    title: string
    createdBy: string
    actionType: CRMAction['actionType']
    description?: string
    ticketId?: string
    assignedTo?: string
    dueDate?: Date
    metadata?: Json
    status?: CRMAction['status']
  }): Promise<CRMAction> {
    const { data, error } = await this.supabase
      .from('crm_actions')
      .insert({
        title: action.title,
        created_by: action.createdBy,
        action_type: action.actionType,
        description: action.description || null,
        ticket_id: action.ticketId || null,
        assigned_to: action.assignedTo || null,
        due_date: action.dueDate?.toISOString() || null,
        metadata: action.metadata || null,
        status: action.status || 'pending',
      } satisfies DbCRMAction)
      .select()
      .single()

    if (error) throw error
    return this.mapActionResponse(data)
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data.map(this.mapMessageResponse)
  }

  async updateActionStatus(
    actionId: string,
    status: CRMAction['status'],
    timestamp = new Date()
  ): Promise<void> {
    const updates: Partial<DbCRMAction> = {
      status,
      ...(status === 'completed' ? { completed_at: timestamp.toISOString() } : {}),
    }

    const { error } = await this.supabase.from('crm_actions').update(updates).eq('id', actionId)

    if (error) throw error
  }

  private mapSessionResponse(data: DbChatSessionRow): ChatSession {
    return {
      id: data.id,
      title: data.title,
      createdBy: data.created_by,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata,
      ticketId: data.ticket_id || undefined,
    }
  }

  mapMessageResponse(data: DbChatMessageRow): ChatMessage {
    return {
      id: data.id,
      sessionId: data.session_id,
      content: data.content,
      type: data.message_type,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    }
  }

  private mapActionResponse(data: DbCRMActionRow): CRMAction {
    return {
      id: data.id,
      title: data.title,
      createdBy: data.created_by,
      actionType: data.action_type,
      description: data.description || undefined,
      ticketId: data.ticket_id || undefined,
      assignedTo: data.assigned_to || undefined,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      metadata: data.metadata,
      status: data.status,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    }
  }
}
