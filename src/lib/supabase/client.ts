import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/supabase'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

export const supabase = createClient() 