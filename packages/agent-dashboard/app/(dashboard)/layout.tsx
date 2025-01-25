'use client'

import { Layout, Menu, Typography, Button } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@autocrm/common'

const { Header, Content, Sider } = Layout
const { Title } = Typography

interface LayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()

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
  }, [router, supabase])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        style={{ height: '100vh', position: 'fixed', left: 0 }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            AutoCRM Agent
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
          items={[
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
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/auth/login')
            }}
            type="link"
          >
            Sign Out
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
