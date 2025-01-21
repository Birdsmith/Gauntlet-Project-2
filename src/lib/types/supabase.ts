export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          created_at: string
          updated_at: string
          customer_id: string
          assigned_agent_id: string | null
          tags: string[]
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
          customer_id: string
          assigned_agent_id?: string | null
          tags?: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
          customer_id?: string
          assigned_agent_id?: string | null
          tags?: string[]
        }
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          content: string
          created_at: string
          is_internal: boolean
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          content: string
          created_at?: string
          is_internal?: boolean
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          is_internal?: boolean
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'agent' | 'customer'
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'agent' | 'customer'
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'agent' | 'customer'
          name?: string
          created_at?: string
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