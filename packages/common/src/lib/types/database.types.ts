export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
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
          created_at: string
          email: string | null
          id: string
          name: string | null
          organization: string | null
          role: Database['public']['Enums']['user_role'] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          organization?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
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
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
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
