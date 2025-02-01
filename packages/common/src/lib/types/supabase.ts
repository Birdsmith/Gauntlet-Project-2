export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          metadata: Json
          status: 'active' | 'closed'
          priority: 'low' | 'normal' | 'high'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          metadata?: Json
          status?: 'active' | 'closed'
          priority?: 'low' | 'normal' | 'high'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metadata?: Json
          status?: 'active' | 'closed'
          priority?: 'low' | 'normal' | 'high'
          created_at?: string
          updated_at?: string
        }
      }
      crm_actions: {
        Row: {
          id: string
          session_id: string
          action_type: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'normal' | 'high'
          ticket_id: string | null
          description: string | null
          assigned_to: string | null
          due_date: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          action_type: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'normal' | 'high'
          ticket_id?: string | null
          description?: string | null
          assigned_to?: string | null
          due_date?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          action_type?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'normal' | 'high'
          ticket_id?: string | null
          description?: string | null
          assigned_to?: string | null
          due_date?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      ticket: {
        Row: {
          id: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string
          assigned_to: string | null
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
