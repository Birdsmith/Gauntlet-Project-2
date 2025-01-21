'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, message, Typography, Spin } from 'antd'
import { supabase } from '@autocrm/common'
import { UserOutlined } from '@ant-design/icons'

const { Title } = Typography

interface ProfileForm {
  name: string
  email: string
}

export default function ProfilePage() {
  const [form] = Form.useForm<ProfileForm>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Get the user's profile from the users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', user.id)
            .single()

          if (error) throw error

          form.setFieldsValue({
            email: profile.email || user.email,
            name: profile.name || '',
          })
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load profile'
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [form])

  const handleUpdateProfile = async (values: ProfileForm) => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Update the user's profile in the users table
      const { error } = await supabase.from('users').update({ name: values.name }).eq('id', user.id)

      if (error) throw error

      message.success('Profile updated successfully')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>
          Profile Settings
        </Title>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            style={{ maxWidth: 400 }}
          >
            <Form.Item label="Email" name="email">
              <Input prefix={<UserOutlined />} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </Form.Item>

            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  )
}
