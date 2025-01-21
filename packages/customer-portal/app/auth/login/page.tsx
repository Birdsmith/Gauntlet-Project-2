'use client'

import { useState } from 'react'
import { Card, Form, Input, Button, message, Typography } from 'antd'
import { supabase } from '@autocrm/common'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Title, Text } = Typography

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true)
      console.log('Attempting login with email:', values.email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      console.log('Login successful:', data)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Full error:', error)
      message.error(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Welcome to AutoCRM
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: '#1677ff' }}>
              Register here
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
