import React, { useEffect, useMemo, useState } from 'react'
import { ChatWidget, ChatService } from '@autocrm/common'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import type { SupabaseClient } from '@supabase/supabase-js'

export const CustomerChat: React.FC = () => {
  const supabase = useSupabaseClient<SupabaseClient>()
  const user = useUser()
  const [isInitialized, setIsInitialized] = useState(false)

  const chatService = useMemo(() => {
    if (!user) {
      return null
    }
    return new ChatService(supabase)
  }, [supabase, user])

  useEffect(() => {
    // Wait for auth to be checked
    const checkAuth = async () => {
      await supabase.auth.getSession()
      setIsInitialized(true)
    }
    checkAuth()
  }, [supabase])

  // Don't render anything until we've checked auth
  if (!isInitialized) {
    return null
  }

  // Only render the chat widget if we have both user and chat service
  if (!user || !chatService) {
    return null
  }

  return <ChatWidget chatService={chatService} userId={user.id} />
}
