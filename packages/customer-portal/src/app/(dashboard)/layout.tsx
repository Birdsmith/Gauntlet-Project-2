'use client'

import { Layout, Menu, Typography, Button } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { CustomerChat } from '../../components/CustomerChat'
import { FileTextOutlined, UserOutlined } from '@ant-design/icons'

const { Header, Content, Sider } = Layout
const { Title } = Typography

interface LayoutProps {
  children: React.ReactNode
}

export default function CustomerDashboardLayout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [supabase] = useState(() => createClientComponentClient())

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={200}
          style={{ height: '100vh', position: 'fixed', left: 0 }}
        >
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              Customer Portal
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
            theme="dark"
            items={[
              {
                key: '/tickets',
                icon: <FileTextOutlined />,
                label: 'My Tickets',
                onClick: () => router.push('/tickets'),
              },
              {
                key: '/profile',
                icon: <UserOutlined />,
                label: 'My Profile',
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
              gap: '16px',
              background: 'transparent',
              height: 'auto',
              lineHeight: 'normal',
              marginTop: '16px',
            }}
          >
            <CustomerChat />
            <Button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
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
    </SessionContextProvider>
  )
}
