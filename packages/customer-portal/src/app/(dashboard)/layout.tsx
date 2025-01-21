'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileTextOutlined, UserOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@autocrm/common'

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const menuItems = [
    {
      key: 'tickets',
      icon: <FileTextOutlined />,
      label: <Link href="/tickets">My Tickets</Link>,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">My Profile</Link>,
    },
  ]

  const handleLogout = () => {
    router.push('/login')
    router.refresh()
  }

  return (
    <DashboardLayout menuItems={menuItems} onLogout={handleLogout} appName="Customer Portal">
      {children}
    </DashboardLayout>
  )
}
