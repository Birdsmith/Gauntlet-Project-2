'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Layout, Menu, Typography, Button } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@autocrm/common'
import AntdRegistry from './providers'

const inter = Inter({ subsets: ['latin'] })
const { Header, Content, Sider } = Layout
const { Title } = Typography

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error('Error checking auth status:', error)
        return
      }

      if (!session) {
        // If not logged in and not already on auth pages, redirect to login
        if (!pathname.startsWith('/auth/')) {
          router.push('/auth/login')
        }
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }

    checkUser()
  }, [pathname, router])

  const content = loading ? (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      Loading...
    </div>
  ) : pathname.startsWith('/auth/') || !user ? (
    children
  ) : (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          AutoCRM
        </Title>
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
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/dashboard',
                label: 'Dashboard',
                onClick: () => router.push('/dashboard'),
              },
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
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ padding: 24, margin: 0, background: '#fff' }}>{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  )

  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>{content}</AntdRegistry>
      </body>
    </html>
  )
}
