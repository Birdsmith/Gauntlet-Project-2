'use client'

import { List, Badge, App, Tag, Space, Checkbox } from 'antd'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@autocrm/common'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type Tables = Database['public']['Tables']
type TicketRow = Tables['ticket']['Row']
type UserRow = Tables['user']['Row']
type InteractionRow = Tables['interaction']['Row']
type TicketStatus = Database['public']['Enums']['ticket_status']
type TicketPriority = Database['public']['Enums']['ticket_priority']
type SortOption = 'newest' | 'oldest' | 'priority_desc' | 'priority_asc'

interface Ticket extends TicketRow {
  creator?: Pick<UserRow, 'name' | 'email'>
  messages?: (InteractionRow & {
    user: Pick<UserRow, 'name' | 'email'>
  })[]
}

interface TicketListProps {
  selectedStatuses: TicketStatus[]
  selectedPriorities: TicketPriority[]
  sortBy: SortOption
  selectedTickets: string[]
  onSelectedTicketsChange: (tickets: string[]) => void
}

export const TicketList = ({
  selectedStatuses,
  selectedPriorities,
  sortBy,
  selectedTickets,
  onSelectedTicketsChange,
}: TicketListProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { message } = App.useApp()
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    let ticketSubscription: RealtimeChannel

    const fetchTickets = async () => {
      try {
        let query = supabase.from('ticket').select(
          `
            id,
            title,
            description,
            status,
            priority,
            created_at,
            updated_at,
            created_by,
            assigned_to,
            creator:created_by (
              name,
              email
            ),
            messages:interaction (
              id,
              content,
              created_at,
              user:user_id (
                name,
                email
              )
            )
          `
        )

        // Apply status filter if any statuses are selected
        if (selectedStatuses.length > 0) {
          query = query.in('status', selectedStatuses)
        }

        // Apply priority filter if any priorities are selected
        if (selectedPriorities.length > 0) {
          query = query.in('priority', selectedPriorities)
        }

        // Apply sorting
        switch (sortBy) {
          case 'newest':
            query = query.order('created_at', { ascending: false })
            break
          case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
          case 'priority_desc':
            query = query.order('priority', { ascending: false })
            break
          case 'priority_asc':
            query = query.order('priority', { ascending: true })
            break
        }

        const { data, error } = await query

        if (error) throw error
        setTickets(data as unknown as Ticket[])
      } catch (error) {
        console.error('Error fetching tickets:', error)
        message.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      ticketSubscription = supabase
        .channel('ticket-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket',
          },
          async () => {
            await fetchTickets()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interaction',
          },
          async () => {
            await fetchTickets()
          }
        )
        .subscribe()
    }

    fetchTickets()
    setupRealtimeSubscription()

    return () => {
      if (ticketSubscription) {
        supabase.removeChannel(ticketSubscription)
      }
    }
  }, [supabase, message, selectedStatuses, selectedPriorities, sortBy])

  const getLastMessage = (ticket: Ticket) => {
    if (!ticket.messages?.length) return 'No messages'
    return ticket.messages[ticket.messages.length - 1].content
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getUnreadCount = (_ticket: Ticket) => {
    // TODO: Implement unread count once we have a way to track read status
    return 0
  }

  const handleTicketClick = (e: React.MouseEvent, ticket: Ticket) => {
    // If clicking the checkbox, don't navigate
    if ((e.target as HTMLElement).closest('.ant-checkbox')) {
      return
    }
    router.push(`/tickets/${ticket.id}`)
  }

  const handleTicketSelect = (ticketId: string, checked: boolean) => {
    if (checked) {
      onSelectedTicketsChange([...selectedTickets, ticketId])
    } else {
      onSelectedTicketsChange(selectedTickets.filter(id => id !== ticketId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedTicketsChange(tickets.map(ticket => ticket.id))
    } else {
      onSelectedTicketsChange([])
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'red'
      case 'high':
        return 'orange'
      case 'medium':
        return 'blue'
      case 'low':
        return 'green'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'green'
      case 'in_progress':
        return 'blue'
      case 'resolved':
        return 'purple'
      case 'closed':
        return 'default'
      default:
        return 'default'
    }
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <List
      itemLayout="vertical"
      dataSource={tickets}
      loading={loading}
      header={
        tickets.length > 0 && (
          <div style={{ padding: '12px 24px' }}>
            <Checkbox
              indeterminate={
                selectedTickets.length > 0 &&
                selectedTickets.length < tickets.length
              }
              checked={
                selectedTickets.length === tickets.length && tickets.length > 0
              }
              onChange={e => handleSelectAll(e.target.checked)}
            >
              Select All
            </Checkbox>
          </div>
        )
      }
      renderItem={ticket => (
        <List.Item
          key={ticket.id}
          onClick={e => handleTicketClick(e, ticket)}
          style={{ cursor: 'pointer' }}
          extra={
            <Space>
              <Tag color={getPriorityColor(ticket.priority)}>
                {ticket.priority.toUpperCase()}
              </Tag>
              <Tag color={getStatusColor(ticket.status)}>
                {formatStatus(ticket.status)}
              </Tag>
            </Space>
          }
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <Checkbox
              checked={selectedTickets.includes(ticket.id)}
              onChange={e => handleTicketSelect(ticket.id, e.target.checked)}
              onClick={e => e.stopPropagation()}
            />
            <div style={{ flex: 1 }}>
              <List.Item.Meta
                title={ticket.title}
                description={getLastMessage(ticket)}
              />
              {getUnreadCount(ticket) > 0 && (
                <Badge count={getUnreadCount(ticket)} />
              )}
            </div>
          </div>
        </List.Item>
      )}
    />
  )
}
