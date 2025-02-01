'use client'

import { useState } from 'react'
import { Form, Input, Button, Alert, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase/browser-client'

const { Text } = Typography

interface LoginFormProps {
  onSuccess?: () => void
  requiredRole?: 'customer' | 'agent'
  portalName?: string
  onRegisterClick?: () => void
}

interface LoginValues {
  email: string
  password: string
}

export default function LoginForm({
  onSuccess,
  requiredRole,
  portalName = 'Portal',
  onRegisterClick,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values: LoginValues) => {
    setError(null)
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (authError) throw authError

      // Check user role if required
      if (requiredRole) {
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (userError) {
          throw new Error('Failed to verify user role')
        }

        if (!userData) {
          await supabase.auth.signOut()
          throw new Error('User account not found')
        }

        if (userData.role !== requiredRole) {
          await supabase.auth.signOut()
          throw new Error(`Access denied. This ${portalName} is for ${requiredRole}s only.`)
        }
      }

      message.success('Login successful')
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      <Form name="login" onFinish={handleLogin} layout="vertical" requiredMark={false}>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email address" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Sign in
          </Button>
        </Form.Item>

        {onRegisterClick && (
          <div style={{ textAlign: 'center' }}>
            <Text>
              Don&apos;t have an account?{' '}
              <a onClick={onRegisterClick} style={{ cursor: 'pointer' }}>
                Register now
              </a>
            </Text>
          </div>
        )}
      </Form>
    </>
  )
}
