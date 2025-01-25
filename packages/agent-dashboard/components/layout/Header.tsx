'use client'

import { Layout, Input, Badge, Avatar, Space, Dropdown, App } from 'antd'
import { BellOutlined, UserOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@autocrm/common'
import { AuthError } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const { Header: AntHeader } = Layout
const { Search } = Input

interface UserData {
  id: string
  name: string
  role: string
  email: string
}

export const Header = () => {
  const router = useRouter()
  const { message } = App.useApp()
  const supabase = createBrowserSupabaseClient()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.user) return

        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('id, name, role, email')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError
        setUserData(userData)
      } catch (error) {
        console.error('Error fetching user data:', error)
        message.error('Failed to load user data')
      }
    }

    fetchUserData()
  }, [supabase, message])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      message.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      const authError = error as AuthError
      message.error(authError.message || 'An error occurred while signing out')
    }
  }

  const profileMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile Settings',
    },
    {
      key: 'preferences',
      label: 'Preferences',
    },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      label: 'Sign Out',
      danger: true,
      onClick: handleSignOut,
    },
  ]

  const handleSearch = (value: string) => {
    console.log('Search:', value)
  }

  return (
    <AntHeader
      style={{
        background: 'var(--component-background)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div style={{ maxWidth: 400, width: '100%' }}>
        <Search
          placeholder="Search tickets..."
          onSearch={handleSearch}
          style={{ width: '100%' }}
        />
      </div>

      <Space size="large">
        <Badge count={5} size="small">
          <BellOutlined
            style={{
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          />
        </Badge>

        <Dropdown
          menu={{ items: profileMenu }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span style={{ display: 'inline-block', marginLeft: 8 }}>
              <span
                style={{
                  display: 'block',
                  lineHeight: '20px',
                  color: 'var(--text-primary)',
                }}
              >
                {userData?.name || 'Loading...'}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                {userData?.role === 'agent'
                  ? 'Support Agent'
                  : userData?.role || 'Loading...'}
              </span>
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}
