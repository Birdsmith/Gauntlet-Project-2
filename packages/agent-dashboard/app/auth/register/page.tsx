'use client'

import { RegisterForm } from '@autocrm/common'
import { Card, Typography } from 'antd'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function RegisterPage() {
  const router = useRouter()

  return (
    <Card style={{ width: 400, padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0 }}>
          Create Agent Account
        </Title>
        <Text type="secondary">Join the support team</Text>
      </div>
      <RegisterForm
        onSuccess={() => router.push('/auth/login?registered=true')}
        onLoginClick={() => router.push('/auth/login')}
        role="agent"
      />
    </Card>
  )
}
