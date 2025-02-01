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
          Agent Portal
        </Title>
        <Text type="secondary">Sign in to manage customer support tickets</Text>
      </div>
      <LoginForm
        onSuccess={() => (window.location.href = '/queue')}
        requiredRole="agent"
        portalName="Agent Portal"
        onRegisterClick={() => router.push('/auth/register')}
      />
    </Card>
  )
}
