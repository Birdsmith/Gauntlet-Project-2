import { useState } from 'react'
import { Layout, Menu, Button, theme } from 'antd'
import type { MenuProps } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined } from '@ant-design/icons'
import { createBrowserSupabaseClient } from '../../lib/supabase/browser-client'

const { Header, Sider, Content } = Layout

interface DashboardLayoutProps {
  children: React.ReactNode
  menuItems: MenuItem[]
  onLogout?: () => void
  appName?: string
}

export type MenuItem = Required<MenuProps>['items'][number] & {
  onClick?: () => void
}

export const DashboardLayout = ({
  children,
  menuItems,
  onLogout,
  appName = 'AutoCRM',
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const supabase = createBrowserSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          {appName}
        </div>
        <Menu theme="dark" mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: 'transparent',
            position: 'absolute',
            width: '100%',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingRight: 24,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
