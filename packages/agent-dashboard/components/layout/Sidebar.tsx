'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Layout, Menu } from 'antd'
import {
  InboxOutlined,
  UserOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import Link from 'next/link'

const { Sider } = Layout

const navigation = [
  {
    key: 'queue',
    label: 'Queue',
    icon: <InboxOutlined />,
    path: '/queue',
  },
  {
    key: 'customers',
    label: 'Customers',
    icon: <UserOutlined />,
    path: '/customers',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChartOutlined />,
    path: '/analytics',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    path: '/settings',
  },
]

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const selectedKey =
    navigation.find(item => pathname.startsWith(item.path))?.key || 'queue'

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={value => setCollapsed(value)}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'var(--component-background)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          height: 64,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <h1
          style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: collapsed ? '14px' : '18px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Agent Portal
        </h1>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{
          background: 'var(--component-background)',
          borderRight: 'none',
        }}
        items={navigation.map(item => ({
          key: item.key,
          icon: item.icon,
          label: <Link href={item.path}>{item.label}</Link>,
        }))}
      />
    </Sider>
  )
}
