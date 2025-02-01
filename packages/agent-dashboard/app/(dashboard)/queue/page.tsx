'use client'

import { useEffect, useState, useCallback } from 'react'
import { Table, Tag, Button, Typography, Card, Statistic, Row, Col } from 'antd'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@autocrm/common'
import { RealtimeChannel } from '@supabase/supabase-js'

const { Title } = Typography

type Ticket = Database['public']['Tables']['ticket']['Row']

export default function QueuePage() {
  const [unassignedTickets, setUnassignedTickets] = useState<Ticket[]>([])
  const [highPriorityTickets, setHighPriorityTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const [unassignedResponse, highPriorityResponse] = await Promise.all([
        // Fetch unassigned tickets
        supabase
          .from('ticket')
          .select('*')
          .is('assigned_to', null)
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        // Fetch high priority tickets
        supabase
          .from('ticket')
          .select('*')
          .in('priority', ['high', 'urgent'])
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false }),
      ])

      if (unassignedResponse.error) throw unassignedResponse.error
      if (highPriorityResponse.error) throw highPriorityResponse.error

      setUnassignedTickets(unassignedResponse.data || [])
      setHighPriorityTickets(highPriorityResponse.data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const setupRealtimeSubscription = useCallback(() => {
    return supabase
      .channel('queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket',
        },
        () => {
          fetchTickets()
        }
      )
      .subscribe()
  }, [supabase, fetchTickets])

  useEffect(() => {
    fetchTickets()
    const newChannel = setupRealtimeSubscription()
    setChannel(newChannel)

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, channel, fetchTickets, setupRealtimeSubscription])

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('ticket')
        .update({ assigned_to: user.id, status: 'in_progress' })
        .eq('id', ticketId)

      if (error) throw error
      router.push(`/tickets/${ticketId}`)
    } catch (error) {
      console.error('Error assigning ticket:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'blue'
      case 'in_progress':
        return 'orange'
      case 'resolved':
        return 'green'
      case 'closed':
        return 'red'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'green'
      case 'medium':
        return 'blue'
      case 'high':
        return 'orange'
      case 'urgent':
        return 'red'
      default:
        return 'default'
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => text.slice(0, 8),
    },
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
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Ticket) => (
        <Button type="primary" onClick={() => handleAssignToMe(record.id)}>
          Assign to Me
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 24]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Unassigned Tickets"
              value={unassignedTickets.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="High Priority Tickets"
              value={highPriorityTickets.length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Title level={3}>Unassigned Tickets</Title>
        <Table
          columns={columns}
          dataSource={unassignedTickets}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <Title level={3}>High Priority Tickets</Title>
        <Table
          columns={columns}
          dataSource={highPriorityTickets}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  )
}
