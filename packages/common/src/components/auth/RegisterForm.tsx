'use client'

import { useState } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase/client'
import type { Database } from '../../lib/types/database.types'

const { Text } = Typography

type UserRole = Database['public']['Enums']['user_role']

export interface RegisterFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
  role?: UserRole
}

interface RegisterValues {
  name: string
  email: string
  password: string
}

export default function RegisterForm({
  onSuccess,
  onLoginClick,
  role = 'customer',
}: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (values: RegisterValues) => {
    console.log('Starting registration process...')
    setError(null)
    setLoading(true)

    try {
      console.log('Calling supabase.auth.signUp with:', {
        email: values.email,
        options: {
          data: {
            name: values.name,
            role,
          },
        },
      })

      const { error: signUpError, data } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            role,
          },
        },
      })

      console.log('Signup response:', {
        error: signUpError
          ? {
              message: signUpError.message,
              status: signUpError.status,
              name: signUpError.name,
            }
          : null,
        data: data
          ? {
              user: data.user
                ? {
                    id: data.user.id,
                    email: data.user.email,
                    metadata: data.user.user_metadata,
                  }
                : null,
              session: data.session ? 'Session exists' : null,
            }
          : null,
      })

      if (signUpError) {
        console.error('Signup error details:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
        })
        throw signUpError
      }

      if (!data.user) {
        console.error('No user data in response:', data)
        throw new Error('No user data returned from signup')
      }

      console.log('Registration successful:', {
        id: data.user.id,
        email: data.user.email,
        metadata: data.user.user_metadata,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error(
        'Registration error:',
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : error
      )
      setError(error instanceof Error ? error.message : 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert
          message="Registration Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form name="register" onFinish={handleRegister} layout="vertical" requiredMark={false}>
        <Form.Item name="name" rules={[{ required: true, message: 'Please input your name!' }]}>
          <Input prefix={<UserOutlined />} placeholder="Full name" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email address" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Create account
          </Button>
        </Form.Item>

        {onLoginClick && (
          <div style={{ textAlign: 'center' }}>
            <Text>
              Already have an account?{' '}
              <a onClick={onLoginClick} style={{ cursor: 'pointer' }}>
                Sign in
              </a>
            </Text>
          </div>
        )}
      </Form>
    </>
  )
}
