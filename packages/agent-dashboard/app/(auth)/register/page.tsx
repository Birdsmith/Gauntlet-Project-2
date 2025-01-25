'use client'

import { Card, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { RegisterForm } from '@autocrm/common'

const { Title, Text } = Typography

export default function RegisterPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/login?registered=true')
    router.refresh()
  }

  const handleLoginClick = () => {
    router.push('/login')
  }

  return (
    <Card style={{ width: 400, padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <Image
            src="/logo.png"
            alt="AutoCRM Logo"
            width={180}
            height={40}
            priority
          />
        </div>
        <Title level={3} style={{ margin: 0 }}>
          Create Agent Account
        </Title>
        <Text type="secondary">Register to join the support team</Text>
      </div>

      <RegisterForm
        role="agent"
        onSuccess={handleSuccess}
        onLoginClick={handleLoginClick}
      />
    </Card>
  )
}
