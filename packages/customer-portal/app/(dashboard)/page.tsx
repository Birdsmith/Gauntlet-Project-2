import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Typography } from 'antd'
import { createBrowserSupabaseClient } from '@autocrm/common'
import {
  FileOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'

const { Title } = Typography

interface DashboardStats {
  totalTickets: number
  openTickets: number
  closedTickets: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: tickets, error } = await supabase
          .from('ticket')
          .select('status')
          .eq('created_by', user.id)

        if (error) throw error

        const totalTickets = tickets.length
        const openTickets = tickets.filter(t => t.status === 'open').length
        const closedTickets = tickets.filter(t => t.status === 'closed').length

        setStats({
          totalTickets,
          openTickets,
          closedTickets,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  return (
    <div>
      <Title level={2}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Total Tickets"
              value={stats.totalTickets}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Open Tickets"
              value={stats.openTickets}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Closed Tickets"
              value={stats.closedTickets}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
