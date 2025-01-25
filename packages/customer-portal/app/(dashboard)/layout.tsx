'use client'

import { Layout, Typography } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  createBrowserSupabaseClient,
  DashboardLayout as CommonDashboardLayout,
  MenuItem,
} from '@autocrm/common'

const { Header } = Layout
const { Title } = Typography

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserSupabaseClient()

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Customer Portal
        </Title>
      </Header>
      <CommonDashboardLayout
        menuItems={menuItems}
        onLogout={() => router.push('/auth/login')}
        appName="Customer Portal"
      >
        {children}
      </CommonDashboardLayout>
    </Layout>
  )
}
