'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Typography, Tag, message } from 'antd'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

type Ticket = {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  created_by: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('ticket')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setTickets(data)
      } catch (error) {
        console.error('Error fetching tickets:', error)
        message.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [supabase])

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Ticket) => (
        <a onClick={() => router.push(`/tickets/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          open: 'blue',
          in_progress: 'orange',
          resolved: 'green',
          closed: 'red',
        }
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors = {
          low: 'green',
          medium: 'blue',
          high: 'orange',
          urgent: 'red',
        }
        return (
          <Tag color={colors[priority as keyof typeof colors]}>
            {priority.toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={2}>My Tickets</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/tickets/new')}
        >
          Create Ticket
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={loading}
      />
    </div>
  )
}
