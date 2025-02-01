'use client'

import { useState } from 'react'
import { Layout, Menu, Button, theme, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase/browser-client'

const { Header, Sider, Content } = Layout
const { Title } = Typography

interface DashboardLayoutProps {
  children: React.ReactNode
  menuItems: MenuItem[]
  onLogout?: () => void
  appName?: string
  additionalElements?: React.ReactNode
  pathname?: string
}

export type MenuItem = Required<MenuProps>['items'][number] & {
  onClick?: () => void
}

export const DashboardLayout = ({
  children,
  menuItems,
  onLogout,
  appName = 'AutoCRM',
  additionalElements,
  pathname = '/',
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG, colorBgElevated },
  } = theme.useToken()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={200}
          style={{ height: '100vh', position: 'fixed', left: 0 }}
        >
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.2)', // Slightly darker background
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              {appName}
            </Title>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ marginLeft: 200 }}>
          <Header
            style={{
              padding: 0,
              background: colorBgElevated,
              boxShadow:
                '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              width: '100%',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingRight: 24,
                height: '100%',
                gap: '16px',
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
                  borderRadius: 0,
                  marginRight: 'auto',
                }}
              />
              {additionalElements}
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  fontSize: '14px',
                  borderRadius: 6,
                }}
              >
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
    </div>
  )
}
