export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          message_type: Database['public']['Enums']['chat_message_type']
          metadata: Json | null
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          message_type: Database['public']['Enums']['chat_message_type']
          metadata?: Json | null
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          message_type?: Database['public']['Enums']['chat_message_type']
          metadata?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'chat_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          status: Database['public']['Enums']['chat_session_status']
          ticket_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['chat_session_status']
          ticket_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['chat_session_status']
          ticket_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_sessions_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
        ]
      }
      comment: {
        Row: {
          content: string
          created_at: string
          message_id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          message_id?: string
          ticket_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          message_id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comment_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comment_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      crm_actions: {
        Row: {
          action_type: Database['public']['Enums']['crm_action_type']
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          status: Database['public']['Enums']['crm_action_status']
          ticket_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type: Database['public']['Enums']['crm_action_type']
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['crm_action_status']
          ticket_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: Database['public']['Enums']['crm_action_type']
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['crm_action_status']
          ticket_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'crm_actions_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
        ]
      }
      document_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      interaction: {
        Row: {
          content: string
          created_at: string
          id: string
          interaction_type: Database['public']['Enums']['interactionType']
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          interaction_type: Database['public']['Enums']['interactionType']
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          interaction_type?: Database['public']['Enums']['interactionType']
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      organization: {
        Row: {
          id: string
          industry_type: string | null
          org_name: string | null
        }
        Insert: {
          id?: string
          industry_type?: string | null
          org_name?: string | null
        }
        Update: {
          id?: string
          industry_type?: string | null
          org_name?: string | null
        }
        Relationships: []
      }
      tag: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: Database['public']['Enums']['ticket_priority'] | null
          status: Database['public']['Enums']['ticket_status'] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: Database['public']['Enums']['ticket_priority'] | null
          status?: Database['public']['Enums']['ticket_status'] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: Database['public']['Enums']['ticket_priority'] | null
          status?: Database['public']['Enums']['ticket_status'] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_assignment: {
        Row: {
          assignment_id: string
          created_at: string
          ticket_id: string
          unassigned_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id?: string
          created_at?: string
          ticket_id: string
          unassigned_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          ticket_id?: string
          unassigned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_assignment_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_assignment_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_history: {
        Row: {
          changed_by: string
          created_at: string
          history_id: string
          prio_changed_to: Database['public']['Enums']['ticket_priority']
          status_changed_to: Database['public']['Enums']['ticket_status']
          ticket_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          history_id?: string
          prio_changed_to: Database['public']['Enums']['ticket_priority']
          status_changed_to: Database['public']['Enums']['ticket_status']
          ticket_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          history_id?: string
          prio_changed_to?: Database['public']['Enums']['ticket_priority']
          status_changed_to?: Database['public']['Enums']['ticket_status']
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_history_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_tag: {
        Row: {
          created_at: string
          tag_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_tag_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tag'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_tag_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'ticket'
            referencedColumns: ['id']
          },
        ]
      }
      user: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          name: string | null
          organization: string | null
          role: Database['public']['Enums']['user_role'] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id: string
          name?: string | null
          organization?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          name?: string | null
          organization?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              '': string
            }
            Returns: unknown
          }
        | {
            Args: {
              '': unknown
            }
            Returns: unknown
          }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      halfvec_avg: {
        Args: {
          '': number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          '': unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          '': unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              '': unknown
            }
            Returns: number
          }
        | {
            Args: {
              '': unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              '': string
            }
            Returns: string
          }
        | {
            Args: {
              '': unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              '': unknown
            }
            Returns: unknown
          }
      match_documents:
        | {
            Args: {
              query_embedding: string
              filter?: Json
              match_count?: number
            }
            Returns: {
              id: string
              content: string
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
              query_embedding: string
              match_threshold: number
              match_count: number
            }
            Returns: {
              id: string
              content: string
              metadata: Json
              similarity: number
            }[]
          }
      sparsevec_out: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          '': unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          '': unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          '': number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              '': string
            }
            Returns: number
          }
        | {
            Args: {
              '': unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          '': string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          '': string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          '': string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          '': unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      chat_message_type: 'user' | 'assistant' | 'system' | 'function' | 'tool'
      chat_session_status: 'active' | 'archived' | 'deleted'
      crm_action_status: 'pending' | 'completed' | 'cancelled'
      crm_action_type: 'email' | 'call' | 'meeting' | 'note' | 'task'
      interactionType: 'email' | 'phone' | 'chat' | 'sms'
      ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      user_role: 'admin' | 'agent' | 'customer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
