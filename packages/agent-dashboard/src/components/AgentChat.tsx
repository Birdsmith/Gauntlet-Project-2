import React from 'react'
import { ChatWidget } from '@autocrm/common'
import { ChatService } from '@autocrm/common'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import type { Database } from '@autocrm/common'

export const AgentChat: React.FC = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const chatService = new ChatService(supabase)

  if (!user) return null

  return <ChatWidget chatService={chatService} userId={user.id} />
}
