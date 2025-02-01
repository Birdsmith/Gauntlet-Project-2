import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../types/database.types'

// Create a single shared instance
export const supabase = createClientComponentClient<Database>()

// Export the create function
export const createBrowserSupabaseClient = () => createClientComponentClient<Database>()

// Export the type for use in components
export type SupabaseClient = ReturnType<typeof createClientComponentClient<Database>>
