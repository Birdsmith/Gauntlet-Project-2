// Components
export * from './components/auth'
export * from './components/layout'
export * from './components/TestComponent'
export * from './components/ThemeProvider'
export * from './components/TicketDetail'
export * from './components/chat'

// Supabase
export {
  supabase,
  createBrowserSupabaseClient,
  type SupabaseClient,
} from './lib/supabase/browser-client'
export { ChatService } from './lib/services/chat.service'

// Types
export type { Database } from './lib/types/database.types'
export type { MenuItem } from './components/layout/DashboardLayout'
export type { ChatMessage, ChatSession, CRMAction } from './lib/types/chat.types'
