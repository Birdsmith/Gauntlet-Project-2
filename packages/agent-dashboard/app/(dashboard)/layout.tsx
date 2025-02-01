'use client'

import { DashboardLayout } from '@autocrm/common'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AgentChat } from '@/src/components/AgentChat'
import { useRouter } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const menuItems = [
    {
      key: '/queue',
      label: 'Queue',
      onClick: () => router.push('/queue'),
    },
    {
      key: '/profile',
      label: 'Profile',
      onClick: () => router.push('/profile'),
    },
  ]

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <DashboardLayout appName="Agent Portal" menuItems={menuItems}>
        {children}
        <AgentChat />
      </DashboardLayout>
    </SessionContextProvider>
  )
}
