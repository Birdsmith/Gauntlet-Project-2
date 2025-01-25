'use server'

// Server-side exports
export { createServerClient } from '../lib/supabase/server-client'
export {
  createMiddlewareSupabaseClient,
  handleAuthMiddleware,
} from '../lib/supabase/middleware-client'

// Types
export type { Database } from '../lib/types/database.types'
