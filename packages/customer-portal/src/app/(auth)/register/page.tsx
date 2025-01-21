'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Typography } from 'antd'
import { RegisterForm } from '@autocrm/common'

const { Text } = Typography

export default function RegisterPage() {
  const router = useRouter()

  const handleRegisterSuccess = () => {
    router.push('/login?registered=true')
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
          <h2 style={{ fontSize: 24, margin: 0 }}>Create your account</h2>
        </div>

        <RegisterForm onSuccess={handleRegisterSuccess} />

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#1890ff' }}>
              Sign in instead
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
