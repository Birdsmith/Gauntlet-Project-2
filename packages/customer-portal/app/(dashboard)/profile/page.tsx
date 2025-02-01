'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, Typography, Form, Input, Button } from 'antd'
import { supabase } from '@autocrm/common'
import type { Database } from '@autocrm/common'
import { App } from 'antd'

const { Title } = Typography

type UserProfile = Database['public']['Tables']['user']['Row']

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const getProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        message.error('Error loading profile')
        return
      }

      if (data) {
        setProfile(data)
        form.setFieldsValue(data)
      }
    } catch (error) {
      message.error('Error loading profile')
    }
  }, [form, message])

  useEffect(() => {
    getProfile()
  }, [getProfile])

  const handleSubmit = async (values: Partial<UserProfile>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        message.error('You must be logged in to update your profile')
        return
      }

      const { error } = await supabase
        .from('user')
        .update({
          name: values.name,
          organization: values.organization,
        })
        .eq('id', user.id)

      if (error) throw error

      message.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      message.error('Failed to update profile')
    }
  }

  if (!profile) {
    return null
  }

  return (
    <div>
      <Title level={2}>Profile</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item name="email" label="Email">
            <Input disabled value={profile.email} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="organization" label="Organization">
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ProfilePage
