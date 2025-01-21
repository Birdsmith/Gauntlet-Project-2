import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

export const createClient = () => {
  const fullUrl = supabaseUrl.startsWith('https://') ? supabaseUrl : `https://${supabaseUrl}`
  console.log('Using Supabase URL:', fullUrl)

  return createClientComponentClient<Database>({
    supabaseUrl: fullUrl,
    supabaseKey,
  })
}

export const supabase = createClient()
