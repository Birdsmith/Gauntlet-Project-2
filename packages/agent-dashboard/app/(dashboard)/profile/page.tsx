'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Avatar,
  Upload,
} from 'antd'
import { UserOutlined, UploadOutlined } from '@ant-design/icons'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import type { Database } from '@autocrm/common'

const { Title } = Typography

type UserProfile = Database['public']['Tables']['user']['Row']

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()
  const user = useUser()
  const supabase = createClientComponentClient<Database>()

  const fetchProfile = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        department: data.department,
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      message.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user, supabase, form])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  const handleSubmit = async (values: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user')
        .update({
          name: values.name,
          department: values.department,
        })
        .eq('id', user!.id)

      if (error) throw error
      message.success('Profile updated successfully')
      await fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      message.error('Failed to update profile')
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user!.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('user')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id)

      if (updateError) throw updateError

      message.success('Avatar updated successfully')
      await fetchProfile()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      message.error('Failed to upload avatar')
    }
  }

  if (!user || loading) {
    return null // or loading state
  }

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>Profile Settings</Title>

      <Card style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Space direction="vertical" size="large">
            <Avatar
              size={128}
              icon={<UserOutlined />}
              src={profile?.avatar_url}
            />
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={file => {
                handleAvatarUpload(file)
                return false
              }}
            >
              <Button icon={<UploadOutlined />}>Change Avatar</Button>
            </Upload>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: profile?.name,
            email: profile?.email,
            department: profile?.department,
          }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input disabled />
          </Form.Item>

          <Form.Item label="Department" name="department">
            <Input />
          </Form.Item>

          <Form.Item label="Role">
            <Input value={profile?.role} disabled />
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
