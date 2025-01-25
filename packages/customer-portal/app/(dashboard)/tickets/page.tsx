'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Typography, Tag } from 'antd'
import { createBrowserSupabaseClient, type Database } from '@autocrm/common'
import { useRouter } from 'next/navigation'

const { Title } = Typography

type Tables = Database['public']['Tables']
type TicketRow = Tables['ticket']['Row']

interface Ticket
  extends Omit<
    TicketRow,
    'description' | 'assigned_to' | 'created_by' | 'updated_at'
  > {}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

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
      render: (status: Database['public']['Enums']['ticket_status'] | null) => {
        const colors = {
          open: 'blue',
          in_progress: 'orange',
          resolved: 'green',
          closed: 'red',
        }
        return status ? (
          <Tag color={colors[status]}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        ) : null
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (
        priority: Database['public']['Enums']['ticket_priority'] | null
      ) => {
        const colors = {
          low: 'green',
          medium: 'orange',
          high: 'red',
          urgent: 'red',
        }
        return priority ? (
          <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>
        ) : null
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
        <Button type="primary" onClick={() => router.push('/tickets/new')}>
          Create New Ticket
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
