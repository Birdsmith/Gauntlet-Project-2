'use client'

import { useState } from 'react'
import { Typography, Button, Space, Dropdown, message } from 'antd'
import { TicketList } from '@/components/tickets/TicketList'
import { QueueFilters } from '@/components/tickets/QueueFilters'
import { type Database } from '@autocrm/common'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { MenuProps } from 'antd'

const { Title } = Typography

type TicketStatus = Database['public']['Enums']['ticket_status']
type TicketPriority = Database['public']['Enums']['ticket_priority']
type SortOption = 'newest' | 'oldest' | 'priority_desc' | 'priority_asc'

export default function QueuePage() {
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<
    TicketPriority[]
  >([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const supabase = createClientComponentClient<Database>()

  const handleBulkAction = async (action: string) => {
    if (selectedTickets.length === 0) {
      message.warning('Please select tickets to perform bulk actions')
      return
    }

    try {
      switch (action) {
        case 'resolve': {
          const { error } = await supabase
            .from('ticket')
            .update({ status: 'resolved' })
            .in('id', selectedTickets)
          if (error) throw error
          message.success(
            `${selectedTickets.length} tickets marked as resolved`
          )
          break
        }
        case 'close': {
          const { error } = await supabase
            .from('ticket')
            .update({ status: 'closed' })
            .in('id', selectedTickets)
          if (error) throw error
          message.success(`${selectedTickets.length} tickets closed`)
          break
        }
        case 'high_priority': {
          const { error } = await supabase
            .from('ticket')
            .update({ priority: 'high' })
            .in('id', selectedTickets)
          if (error) throw error
          message.success(
            `${selectedTickets.length} tickets set to high priority`
          )
          break
        }
        case 'assign_to_me': {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) {
            message.error('You must be logged in to assign tickets')
            return
          }
          const { error } = await supabase
            .from('ticket')
            .update({ assigned_to: user.id })
            .in('id', selectedTickets)
          if (error) throw error
          message.success(`${selectedTickets.length} tickets assigned to you`)
          break
        }
      }
      // Clear selection after successful action
      setSelectedTickets([])
    } catch (error) {
      console.error('Error performing bulk action:', error)
      message.error('Failed to perform bulk action')
    }
  }

  const bulkActionItems: MenuProps['items'] = [
    {
      key: 'status',
      label: 'Status',
      children: [
        {
          key: 'resolve',
          label: 'Mark as Resolved',
          onClick: () => handleBulkAction('resolve'),
        },
        {
          key: 'close',
          label: 'Close Tickets',
          onClick: () => handleBulkAction('close'),
        },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      children: [
        {
          key: 'high_priority',
          label: 'Set to High Priority',
          onClick: () => handleBulkAction('high_priority'),
        },
      ],
    },
    {
      key: 'assignment',
      label: 'Assignment',
      children: [
        {
          key: 'assign_to_me',
          label: 'Assign to Me',
          onClick: () => handleBulkAction('assign_to_me'),
        },
      ],
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            Ticket Queue
          </Title>
          <Space>
            {selectedTickets.length > 0 && (
              <span>{selectedTickets.length} tickets selected</span>
            )}
            <Dropdown menu={{ items: bulkActionItems }} trigger={['click']}>
              <Button type="primary">Bulk Actions</Button>
            </Dropdown>
          </Space>
        </Space>
      </div>

      <div style={{ marginBottom: 24 }}>
        <QueueFilters
          onStatusChange={values =>
            setSelectedStatuses(values as TicketStatus[])
          }
          onPriorityChange={values =>
            setSelectedPriorities(values as TicketPriority[])
          }
          onSortChange={setSortBy}
          selectedStatuses={selectedStatuses}
          selectedPriorities={selectedPriorities}
          sortBy={sortBy}
        />
      </div>

      <TicketList
        selectedStatuses={selectedStatuses}
        selectedPriorities={selectedPriorities}
        sortBy={sortBy}
        selectedTickets={selectedTickets}
        onSelectedTicketsChange={setSelectedTickets}
      />
    </div>
  )
}
