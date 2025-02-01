'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@autocrm/common'

export default function Home() {
  const router = useRouter()

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
  }, [router])

  // Return null since we're redirecting anyway
  return null
}
