'use client'

import { useState } from 'react'
import { Form, Input, Button, Select, Card, Typography, message } from 'antd'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@autocrm/common'
import type { Database } from '@autocrm/common'

const { Title } = Typography
const { TextArea } = Input

type TicketForm = {
  title: string
  description: string
  priority: Database['public']['Enums']['ticket_priority']
}

export default function NewTicketPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const handleSubmit = async (values: TicketForm) => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        message.error('You must be logged in to create a ticket')
        return
      }

      const { error } = await supabase.from('ticket').insert({
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: 'open',
        created_by: user.id,
      })

      if (error) throw error

      message.success('Ticket created successfully')
      router.push('/tickets')
    } catch (error) {
      console.error('Error creating ticket:', error)
      message.error('Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={2}>Create New Ticket</Title>

      <Card>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'low' as const }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter ticket title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} placeholder="Describe your issue in detail" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select a priority' }]}
          >
            <Select>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Ticket
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => router.push('/tickets')}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
