import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing required Supabase environment variables')
}

export const createClient = () => {
  const fullUrl = supabaseUrl.startsWith('https://') ? supabaseUrl : `https://${supabaseUrl}`
  console.log('Using Supabase URL:', fullUrl)

  const client = createClientComponentClient<Database>({
    supabaseUrl: fullUrl,
    supabaseKey,
  })

  // Initialize session handling
  client.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, 'Session exists:', !!session)
    if (event === 'SIGNED_OUT') {
      // Clear any cached data
      client.auth.signOut()
    }
  })

  return client
}

export const supabase = createClient()

export type SupabaseClient = ReturnType<typeof createClient>
export type Tables = Database['public']['Tables']
export type CommentRow = Tables['comment']['Row']
export type TicketHistoryRow = Tables['ticket_history']['Row']
export type UserRow = Tables['user']['Row']
