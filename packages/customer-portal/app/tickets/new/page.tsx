'use client'

import { useState } from 'react'
import { Form, Input, Button, Select, Card, Typography, message } from 'antd'
import { supabase } from '@autocrm/common'
import { useRouter } from 'next/navigation'

const { Title } = Typography
const { TextArea } = Input

interface NewTicketForm {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: NewTicketForm) => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('tickets').insert({
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: 'open',
        created_by: user.id,
      })

      if (error) throw error

      message.success('Ticket created successfully')
      router.push('/tickets')
    } catch (error: any) {
      message.error(error.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Create New Ticket
      </Title>

      <Card style={{ maxWidth: 800 }}>
        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="Title"
            name="title"
            rules={[
              { required: true, message: 'Please enter a title' },
              { max: 100, message: 'Title must be less than 100 characters' },
            ]}
          >
            <Input size="large" placeholder="Brief summary of your issue" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter a description' },
              { min: 20, message: 'Description must be at least 20 characters' },
            ]}
          >
            <TextArea rows={6} placeholder="Detailed description of your issue..." size="large" />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: 'Please select a priority' }]}
          >
            <Select
              size="large"
              placeholder="Select priority level"
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ]}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <Button onClick={() => router.back()}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Ticket
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
