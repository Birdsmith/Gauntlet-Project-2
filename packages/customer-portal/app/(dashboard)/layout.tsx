'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout as CommonDashboardLayout } from '@autocrm/common'
import type { MenuProps } from 'antd'
import { CustomerChat } from '../../src/components/CustomerChat'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface DashboardLayoutProps {
  children: React.ReactNode
}

type MenuItem = Required<MenuProps>['items'][number] & {
  onClick?: () => void
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [supabase] = useState(() => createClientComponentClient())

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [pathname, router, supabase])

  const menuItems: MenuItem[] = [
    {
      key: '/tickets',
      label: 'My Tickets',
      onClick: () => router.push('/tickets'),
    },
    {
      key: '/profile',
      label: 'Profile',
      onClick: () => router.push('/profile'),
    },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <CommonDashboardLayout
        menuItems={menuItems}
        onLogout={handleLogout}
        appName="Customer Portal"
        additionalElements={<CustomerChat />}
        pathname={pathname}
      >
        {children}
      </CommonDashboardLayout>
    </SessionContextProvider>
  )
}
