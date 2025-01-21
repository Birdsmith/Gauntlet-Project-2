import { useState } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase/client'

interface RegisterFormProps {
  onSuccess?: () => void
}

interface RegisterValues {
  name: string
  email: string
  password: string
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (values: RegisterValues) => {
    setError(null)
    setLoading(true)

    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            role: 'customer',
          },
        },
      })

      if (signUpError) throw signUpError

      if (!data.user) {
        throw new Error('No user data returned from signup')
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
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
      </Form>
    </>
  )
}
