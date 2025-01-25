'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@autocrm/common'

export default function Home() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.replace('/tickets')
      } else {
        router.replace('/auth/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  // Return null since we're redirecting anyway
  return null
}
