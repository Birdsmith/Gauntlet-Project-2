'use client'

import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Typography } from 'antd'
import { supabase } from '@autocrm/common'
import { FileOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    recentResponses: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get total tickets
      const { count: totalTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact' })
        .eq('created_by', user.id)

      // Get open tickets
      const { count: openTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact' })
        .eq('created_by', user.id)
        .in('status', ['open', 'in_progress'])

      // Get recent responses (last 24 hours)
      const { count: recentResponses } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('ticket.created_by', user.id)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        recentResponses: recentResponses || 0,
      })
    }

    fetchStats()
  }, [])

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Tickets" value={stats.totalTickets} prefix={<FileOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Open Tickets"
              value={stats.openTickets}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: stats.openTickets > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Recent Responses (24h)"
              value={stats.recentResponses}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
