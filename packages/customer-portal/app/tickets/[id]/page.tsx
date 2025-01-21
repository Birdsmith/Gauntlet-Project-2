'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  Typography,
  Tag,
  Button,
  Form,
  Input,
  Timeline,
  message,
  Spin,
  Descriptions,
  Modal,
} from 'antd'
import { supabase } from '@autocrm/common'
import { useParams, useRouter } from 'next/navigation'
import { DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface TicketDetails {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  created_by: string
  creator: {
    name: string
    email: string
  }
  assigned_to: string | null
  assignee?: {
    name: string
    email: string
  }
}

interface Message {
  id: string
  content: string
  created_at: string
  user: {
    name: string
    email: string
  }
}

export default function TicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [messageForm] = Form.useForm()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user.id)
      }
    })
  }, [])

  const fetchTicketDetails = useCallback(async () => {
    if (!params.id) return

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          creator:created_by(name, email),
          assignee:assigned_to(name, email)
        `
        )
        .eq('id', params.id)
        .single()

      if (error) throw error
      setTicket(data)

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(
          `
          *,
          user:user_id(name, email)
        `
        )
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load ticket details'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchTicketDetails()
  }, [fetchTicketDetails])

  const handleSendMessage = async (values: { content: string }) => {
    try {
      setSendingMessage(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('messages').insert({
        ticket_id: params.id,
        user_id: user.id,
        content: values.content,
      })

      if (error) throw error

      messageForm.resetFields()
      await fetchTicketDetails() // Refresh messages
      message.success('Message sent successfully')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      message.error(errorMessage)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Ticket',
      content: 'Are you sure you want to delete this ticket? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDeleting(true)
          const { error } = await supabase.from('tickets').delete().eq('id', params.id)

          if (error) throw error

          message.success('Ticket deleted successfully')
          router.push('/tickets')
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete ticket'
          message.error(errorMessage)
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="secondary">Ticket not found</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          {ticket.title}
        </Title>
        <div>
          {currentUser === ticket.created_by && (
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              loading={deleting}
              onClick={handleDelete}
              style={{ marginRight: '8px' }}
            >
              Delete Ticket
            </Button>
          )}
          <Button onClick={() => router.push('/tickets')}>Back to Tickets</Button>
        </div>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Descriptions title="Ticket Information" bordered>
          <Descriptions.Item label="Status">
            <Tag
              color={
                ticket.status === 'open'
                  ? 'blue'
                  : ticket.status === 'in_progress'
                    ? 'orange'
                    : ticket.status === 'resolved'
                      ? 'green'
                      : 'default'
              }
            >
              {ticket.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag
              color={
                ticket.priority === 'high'
                  ? 'red'
                  : ticket.priority === 'medium'
                    ? 'orange'
                    : ticket.priority === 'low'
                      ? 'green'
                      : 'default'
              }
            >
              {ticket.priority.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {ticket.creator?.name || ticket.creator?.email}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(ticket.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {new Date(ticket.updated_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned To">
            {ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={3}>
            {ticket.description}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Messages">
        {messages.length > 0 ? (
          <Timeline style={{ marginBottom: '24px' }}>
            {messages.map(msg => (
              <Timeline.Item key={msg.id}>
                <div>
                  <Text strong>{msg.user?.name || msg.user?.email}</Text>
                  <Text type="secondary" style={{ marginLeft: '8px' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </Text>
                </div>
                <div style={{ marginTop: '4px' }}>{msg.content}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Text type="secondary">No messages yet</Text>
        )}

        <Form form={messageForm} onFinish={handleSendMessage} layout="vertical">
          <Form.Item name="content" rules={[{ required: true, message: 'Please enter a message' }]}>
            <TextArea rows={4} placeholder="Type your message here..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sendingMessage}>
              Send Message
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
