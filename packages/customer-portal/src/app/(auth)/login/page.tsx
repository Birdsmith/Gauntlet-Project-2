'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Typography } from 'antd'
import { LoginForm } from '@autocrm/common'

const { Text } = Typography

export default function LoginPage() {
  const router = useRouter()

  const handleLoginSuccess = () => {
    router.push('/tickets')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f2f5',
        padding: '24px',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, margin: 0 }}>Sign in to your account</h2>
        </div>

        <LoginForm onSuccess={handleLoginSuccess} />

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#1890ff' }}>
              Create one now
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
