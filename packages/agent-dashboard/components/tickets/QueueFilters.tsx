'use client'

import { Card, Form, Checkbox, Select, Space } from 'antd'

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
  onStatusChange: (values: (string | number)[]) => void
  onPriorityChange: (values: (string | number)[]) => void
  selectedStatuses: (string | number)[]
  selectedPriorities: (string | number)[]
}

export const QueueFilters = ({
  onStatusChange,
  onPriorityChange,
  selectedStatuses,
  selectedPriorities,
}: QueueFiltersProps) => {
  const handleSortChange = (value: string) => {
    console.log('Sort:', value)
  }

  return (
    <Card size="small">
      <Form layout="vertical">
        <Space size="large" align="start">
          <Form.Item label="Status">
            <Checkbox.Group
              options={statusOptions}
              value={selectedStatuses}
              onChange={onStatusChange}
            />
          </Form.Item>

          <Form.Item label="Priority">
            <Checkbox.Group
              options={priorityOptions}
              value={selectedPriorities}
              onChange={onPriorityChange}
            />
          </Form.Item>

          <Form.Item label="Sort By" style={{ marginBottom: 0, minWidth: 200 }}>
            <Select
              defaultValue="newest"
              options={sortOptions}
              onChange={handleSortChange}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>
      </Form>
    </Card>
  )
}
