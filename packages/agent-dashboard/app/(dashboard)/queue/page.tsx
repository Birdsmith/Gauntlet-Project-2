'use client'

import { useState } from 'react'
import { Typography, Button, Space } from 'antd'
import { TicketList } from '@/components/tickets/TicketList'
import { QueueFilters } from '@/components/tickets/QueueFilters'

const { Title } = Typography

export default function QueuePage() {
  const [selectedStatuses, setSelectedStatuses] = useState<(string | number)[]>(
    ['open']
  )
  const [selectedPriorities, setSelectedPriorities] = useState<
    (string | number)[]
  >([])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            Ticket Queue
          </Title>
          <Button type="primary">Bulk Actions</Button>
        </Space>
      </div>

      <div style={{ marginBottom: 24 }}>
        <QueueFilters
          onStatusChange={setSelectedStatuses}
          onPriorityChange={setSelectedPriorities}
          selectedStatuses={selectedStatuses}
          selectedPriorities={selectedPriorities}
        />
      </div>

      <TicketList />
    </div>
  )
}
