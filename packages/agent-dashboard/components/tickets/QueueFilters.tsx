'use client'

import { Card, Form, Checkbox, Select, Space } from 'antd'
import { type Database } from '@autocrm/common'

type TicketStatus = Database['public']['Enums']['ticket_status']
type TicketPriority = Database['public']['Enums']['ticket_priority']
type SortOption = 'newest' | 'oldest' | 'priority_desc' | 'priority_asc'

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Priority: High to Low', value: 'priority_desc' },
  { label: 'Priority: Low to High', value: 'priority_asc' },
]

interface QueueFiltersProps {
  onStatusChange: (values: TicketStatus[]) => void
  onPriorityChange: (values: TicketPriority[]) => void
  onSortChange: (value: SortOption) => void
  selectedStatuses: TicketStatus[]
  selectedPriorities: TicketPriority[]
  sortBy: SortOption
}

export const QueueFilters = ({
  onStatusChange,
  onPriorityChange,
  onSortChange,
  selectedStatuses,
  selectedPriorities,
  sortBy,
}: QueueFiltersProps) => {
  return (
    <Card size="small">
      <Form layout="vertical">
        <Space size="large" align="start">
          <Form.Item label="Status">
            <Checkbox.Group
              options={statusOptions}
              value={selectedStatuses}
              onChange={values => onStatusChange(values as TicketStatus[])}
            />
          </Form.Item>

          <Form.Item label="Priority">
            <Checkbox.Group
              options={priorityOptions}
              value={selectedPriorities}
              onChange={values => onPriorityChange(values as TicketPriority[])}
            />
          </Form.Item>

          <Form.Item label="Sort By" style={{ marginBottom: 0, minWidth: 200 }}>
            <Select
              value={sortBy}
              options={sortOptions}
              onChange={value => onSortChange(value as SortOption)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>
      </Form>
    </Card>
  )
}
