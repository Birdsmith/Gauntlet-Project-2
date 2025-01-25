'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Tag, Typography, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { createBrowserSupabaseClient } from '@autocrm/common'

const { Title } = Typography

interface Ticket {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    try {
      const {
        data: { session },
      } = await createBrowserSupabaseClient().auth.getSession()
      if (!session?.user?.id) return

      const { data: tickets, error } = await createBrowserSupabaseClient()
        .from('ticket')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTickets(tickets)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load tickets'
      message.error(errorMessage)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
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
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Ticket) => (
        <Button type="link" href={`/tickets/${record.id}`}>
          View Details
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2}>My Tickets</Title>
        <Button type="primary" icon={<PlusOutlined />} href="/tickets/new">
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
