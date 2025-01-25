'use client'

import { LoginForm } from '@autocrm/common'
import { Card, Typography } from 'antd'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function LoginPage() {
  const router = useRouter()

  return (
    <Card style={{ width: 400, padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0 }}>
          Customer Portal
        </Title>
        <Text type="secondary">Sign in to manage your support tickets</Text>
      </div>
      <LoginForm
        onSuccess={() => router.push('/tickets')}
        requiredRole="customer"
        portalName="Customer Portal"
        onRegisterClick={() => router.push('/auth/register')}
      />
    </Card>
  )
}
