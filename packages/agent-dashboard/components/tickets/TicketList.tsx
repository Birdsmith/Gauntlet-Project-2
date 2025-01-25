'use client'

import { List, Badge, App } from 'antd'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@autocrm/common'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type Tables = Database['public']['Tables']
type TicketRow = Tables['ticket']['Row']
type UserRow = Tables['user']['Row']
type InteractionRow = Tables['interaction']['Row']

interface Ticket extends TicketRow {
  creator?: Pick<UserRow, 'name' | 'email'>
  messages?: (InteractionRow & {
    user: Pick<UserRow, 'name' | 'email'>
  })[]
}

export const TicketList = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { message } = App.useApp()
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    let ticketSubscription: RealtimeChannel

    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('ticket')
          .select(
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
          .order('created_at', { ascending: false })

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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          async _payload => {
            // Refetch tickets when any change occurs
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          async _payload => {
            // Refetch tickets when any interaction is added/updated
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
  }, [supabase, message])

  const getLastMessage = (ticket: Ticket) => {
    if (!ticket.messages?.length) return 'No messages'
    return ticket.messages[ticket.messages.length - 1].content
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getUnreadCount = (_ticket: Ticket) => {
    // TODO: Implement unread count once we have a way to track read status
    return 0
  }

  const handleTicketClick = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`)
  }

  return (
    <List
      itemLayout="vertical"
      dataSource={tickets}
      loading={loading}
      renderItem={ticket => (
        <List.Item
          key={ticket.id}
          onClick={() => handleTicketClick(ticket)}
          style={{ cursor: 'pointer' }}
        >
          <List.Item.Meta
            title={ticket.title}
            description={getLastMessage(ticket)}
          />
          {getUnreadCount(ticket) > 0 && (
            <Badge count={getUnreadCount(ticket)} />
          )}
        </List.Item>
      )}
    />
  )
}
