'use client'

import { useEffect, useState, useCallback } from 'react'
import { Table, Tag, Button, Input, Space, Select } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@autocrm/common'
import { RealtimeChannel } from '@supabase/supabase-js'

const { Search } = Input

type Ticket = Database['public']['Tables']['ticket']['Row']

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ticket')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const setupRealtimeSubscription = useCallback(() => {
    return supabase
      .channel('tickets')
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
      render: (text: string) => (
        <a onClick={() => router.push(`/tickets/${text}`)}>
          {text.slice(0, 8)}
        </a>
      ),
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
      filters: [
        { text: 'Open', value: 'open' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Resolved', value: 'resolved' },
        { text: 'Closed', value: 'closed' },
      ],
      filteredValue: statusFilter,
      onFilter: (value: string, record: Ticket) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'Low', value: 'low' },
        { text: 'Medium', value: 'medium' },
        { text: 'High', value: 'high' },
        { text: 'Urgent', value: 'urgent' },
      ],
      filteredValue: priorityFilter,
      onFilter: (value: string, record: Ticket) => record.priority === value,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ]

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Space size="middle">
          <Search
            placeholder="Search tickets..."
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            mode="multiple"
            placeholder="Filter by status"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'Open', value: 'open' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Closed', value: 'closed' },
            ]}
          />
          <Select
            mode="multiple"
            placeholder="Filter by priority"
            style={{ width: 200 }}
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/tickets/new')}
        >
          New Ticket
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredTickets}
        loading={loading}
        rowKey="id"
        pagination={{
          total: filteredTickets.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  )
}
