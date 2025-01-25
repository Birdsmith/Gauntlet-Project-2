'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '../types/database.types'
import { serverConfig } from './server-config'

export const { dynamic, runtime } = serverConfig

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// For middleware and server actions where we need more control
export const createCustomServerClient = (cookieStore: () => ReturnType<typeof cookies>) => {
  return createServerComponentClient<Database>({ cookies: cookieStore })
}
