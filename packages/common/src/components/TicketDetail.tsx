'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Card,
  Typography,
  Tag,
  Button,
  Form,
  Input,
  Timeline,
  App,
  Spin,
  Descriptions,
  Modal,
  Select,
  Space,
  message,
} from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  createClient,
  SupabaseClient,
  CommentRow,
  TicketHistoryRow,
  UserRow,
} from '../lib/supabase/client'
import type { Database } from '../lib/types/database.types'

const { Title, Text } = Typography
const { TextArea } = Input

type Tables = Database['public']['Tables']
type TicketPriority = Database['public']['Enums']['ticket_priority']
type TicketStatus = Database['public']['Enums']['ticket_status']
type InteractionType = Database['public']['Enums']['interactionType']

type BaseComment = Tables['comment']['Row']
type BaseInteraction = Tables['interaction']['Row']
type BaseTicketHistory = Tables['ticket_history']['Row']
type BaseUser = Tables['user']['Row']

interface ExtendedComment extends BaseComment {
  user: Pick<BaseUser, 'name' | 'email'> | null
}

interface ExtendedInteraction extends BaseInteraction {
  user: Pick<BaseUser, 'name' | 'email'> | null
}

interface ExtendedTicketHistory extends BaseTicketHistory {
  user: Pick<BaseUser, 'name' | 'email'> | null
}

interface TicketDetails {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  created_at: string
  updated_at: string
  created_by: string
  creator: {
    name: string | null
    email: string | null
  }
  assigned_to: string | null
  assignee?: {
    name: string | null
    email: string | null
  }
}

type Comment = {
  message_id: string
  content: string
  created_at: string
  ticket_id: string
  user_id: string
  user: Pick<UserRow, 'name' | 'email'>
}

type HistoryEntry = {
  history_id: string
  created_at: string
  status_changed_to: TicketStatus
  prio_changed_to: TicketPriority
  ticket_id: string
  changed_by: string
  user: Pick<UserRow, 'name' | 'email'>
}

interface Message {
  id: string | number
  content: string
  created_at: string
  type: 'interaction' | 'history'
  user: {
    name: string | null
    email: string | null
  }
  status_changed_to?: TicketStatus | null
  prio_changed_to?: TicketPriority | null
}

interface TicketDetailProps {
  ticketId: string
  userRole: 'customer' | 'agent' | 'admin'
  onBack: () => void
}

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

export function TicketDetail({ ticketId, userRole, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [comments, setComments] = useState<ExtendedComment[]>([])
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [closeModalVisible, setCloseModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [commentForm] = Form.useForm()
  const supabase: SupabaseClient = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const isStaff = userRole === 'agent' || userRole === 'admin'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollCommentsToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to bottom when messages or comments change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    scrollCommentsToBottom()
  }, [comments])

  const fetchTicket = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // For staff, fetch any ticket. For customers, only fetch their own tickets
      const query = supabase
        .from('ticket')
        .select(
          `
          *,
          creator:created_by(name, email),
          assignee:assigned_to(name, email)
        `
        )
        .eq('id', ticketId)

      if (!isStaff) {
        query.eq('created_by', user.id)
      }

      const { data: ticketData, error: ticketError } = await query.single()

      if (ticketError) throw ticketError

      // Fetch interactions, ticket history, and comments if staff
      const { data: interactionData, error: interactionError } = await supabase
        .from('interaction')
        .select(
          `
          id,
          content,
          created_at,
          ticket_id,
          user_id,
          interaction_type,
          user:user_id(name, email)
        `
        )
        .eq('ticket_id', ticketId)

      if (interactionError) throw interactionError

      const { data: historyData, error: historyError } = await supabase
        .from('ticket_history')
        .select(
          `
          history_id,
          created_at,
          status_changed_to,
          prio_changed_to,
          ticket_id,
          changed_by,
          user:changed_by(name, email)
        `
        )
        .eq('ticket_id', ticketId)

      if (historyError) throw historyError

      let commentData: ExtendedComment[] | null = null
      if (isStaff) {
        const { data: comments, error: commentError } = await supabase
          .from('comment')
          .select(
            `
            message_id,
            content,
            created_at,
            ticket_id,
            user_id,
            user:user_id (
              name,
              email
            )
          `
          )
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })

        if (commentError) throw commentError
        commentData = comments as ExtendedComment[]
      }

      // Handle the results
      const interactions =
        interactionData?.map((int) => ({
          id: int.id,
          content: int.content,
          created_at: int.created_at,
          user: int.user || { name: null, email: null },
          type: 'interaction' as const,
        })) || []

      const history =
        historyData?.map((hist) => ({
          id: hist.history_id,
          content: formatHistoryEntry({
            status_changed_to: hist.status_changed_to,
            prio_changed_to: hist.prio_changed_to,
          }),
          created_at: hist.created_at,
          user: hist.user || { name: null, email: null },
          type: 'history' as const,
          status_changed_to: hist.status_changed_to,
          prio_changed_to: hist.prio_changed_to,
        })) || []

      if (isStaff && commentData) {
        setComments(commentData)
      }

      const allMessages = [...interactions, ...history].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      if (ticketData) {
        setTicket(ticketData as unknown as TicketDetails)
        setMessages(allMessages)
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error)
      message.error('Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }, [supabase, ticketId, isStaff])

  const formatHistoryEntry = (entry: {
    status_changed_to?: TicketStatus | null
    prio_changed_to?: TicketPriority | null
  }) => {
    const changes = []
    if (entry.status_changed_to) {
      changes.push(`Status changed to ${entry.status_changed_to}`)
    }
    if (entry.prio_changed_to) {
      changes.push(`Priority changed to ${entry.prio_changed_to}`)
    }
    return changes.length > 0 ? changes.join(' and ') : 'Ticket created'
  }

  useEffect(() => {
    let ticketSubscription: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      ticketSubscription = supabase
        .channel(`ticket-${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket',
            filter: `id=eq.${ticketId}`,
          },
          async (payload) => {
            if (payload.new) {
              setTicket((prev) => (prev ? { ...prev, ...payload.new } : null))
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'interaction',
            filter: `ticket_id=eq.${ticketId}`,
          },
          async (payload) => {
            const { data: userData } = await supabase
              .from('user')
              .select('name, email')
              .eq('id', payload.new.user_id)
              .single()

            setMessages((prev) =>
              [
                ...prev,
                {
                  id: payload.new.id,
                  content: payload.new.content,
                  created_at: payload.new.created_at,
                  user: userData || { name: null, email: null },
                  type: 'interaction' as const,
                },
              ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_history',
            filter: `ticket_id=eq.${ticketId}`,
          },
          async (payload) => {
            const { data: userData } = await supabase
              .from('user')
              .select('name, email')
              .eq('id', payload.new.changed_by)
              .single()

            setMessages((prev) =>
              [
                ...prev,
                {
                  id: payload.new.id,
                  content: formatHistoryEntry({
                    status_changed_to: payload.new.status_changed_to,
                    prio_changed_to: payload.new.prio_changed_to,
                  }),
                  created_at: payload.new.created_at,
                  user: userData || { name: null, email: null },
                  type: 'history' as const,
                },
              ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            )
          }
        )

      if (isStaff) {
        ticketSubscription = ticketSubscription.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comment',
            filter: `ticket_id=eq.${ticketId}`,
          },
          async (payload) => {
            const { data: userData } = await supabase
              .from('user')
              .select('name, email')
              .eq('id', payload.new.user_id)
              .single()

            setComments((prev) => [
              ...prev,
              {
                message_id: payload.new.message_id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                ticket_id: payload.new.ticket_id,
                user_id: payload.new.user_id,
                user: userData || { name: null, email: null },
              },
            ])
          }
        )
      }

      await ticketSubscription.subscribe()
    }

    fetchTicket()
    setupRealtimeSubscription()

    return () => {
      if (ticketSubscription) {
        supabase.removeChannel(ticketSubscription)
      }
    }
  }, [fetchTicket, isStaff])

  const handleSendMessage = async (values: { content: string }) => {
    try {
      setSending(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('interaction').insert({
        content: values.content,
        ticket_id: ticketId,
        user_id: user.id,
        interaction_type: 'chat',
      })

      if (error) throw error

      form.resetFields()
      message.success('Message sent')
    } catch (error) {
      console.error('Error sending message:', error)
      message.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleAssignToMe = async () => {
    setAssigning(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First create a ticket assignment record
      const { error: assignmentError } = await supabase.from('ticket_assignment').insert({
        ticket_id: ticketId,
        user_id: user.id,
      })

      if (assignmentError) throw assignmentError

      // Then update the ticket's assigned_to field
      const { error: updateError } = await supabase
        .from('ticket')
        .update({ assigned_to: user.id })
        .eq('id', ticketId)

      if (updateError) throw updateError

      message.success('Ticket assigned to you')
    } catch (error) {
      console.error('Error assigning ticket:', error)
      message.error('Failed to assign ticket')
    } finally {
      setAssigning(false)
    }
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('ticket')
        .update({ status: newStatus })
        .eq('id', ticketId)

      if (error) throw error
      message.success('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      message.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    setUpdatingPriority(true)
    try {
      const { error } = await supabase
        .from('ticket')
        .update({ priority: newPriority })
        .eq('id', ticketId)

      if (error) throw error
      message.success('Priority updated successfully')
    } catch (error) {
      console.error('Error updating priority:', error)
      message.error('Failed to update priority')
    } finally {
      setUpdatingPriority(false)
    }
  }

  const handleCloseTicket = () => {
    setCloseModalVisible(true)
  }

  const confirmCloseTicket = async () => {
    try {
      const { error } = await supabase
        .from('ticket')
        .update({ status: 'closed' })
        .eq('id', ticketId)

      if (error) throw error

      message.success('Ticket closed')
      onBack()
    } catch (error) {
      console.error('Error closing ticket:', error)
      message.error('Failed to close ticket')
    } finally {
      setCloseModalVisible(false)
    }
  }

  const handleSendComment = async (values: { content: string }) => {
    try {
      setSendingComment(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('comment').insert({
        content: values.content,
        ticket_id: ticketId,
        user_id: user.id,
      })

      if (error) throw error

      commentForm.resetFields()
      message.success('Comment added')
    } catch (error) {
      console.error('Error sending comment:', error)
      message.error('Failed to add comment')
    } finally {
      setSendingComment(false)
    }
  }

  const handleCommentInsert = (payload: any) => {
    if (payload.new) {
      const newComment: ExtendedComment = {
        message_id: payload.new.message_id,
        content: payload.new.content,
        created_at: payload.new.created_at,
        ticket_id: payload.new.ticket_id,
        user_id: payload.new.user_id,
        user: payload.new.user || { name: null, email: null },
      }
      setComments((prevComments) => [...prevComments, newComment])
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Text>Ticket not found</Text>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 88px)',
        position: 'relative',
        gap: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Top section */}
        <div style={{ flexShrink: 0, marginBottom: 24 }}>
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
                Back
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {ticket.title}
              </Title>
            </div>
            {!isStaff && (
              <Button danger icon={<DeleteOutlined />} onClick={handleCloseTicket}>
                Close Ticket
              </Button>
            )}
          </div>

          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Space size={8} align="center">
                  <Title level={3} style={{ margin: 0 }}>
                    {ticket.title}
                  </Title>
                  {isStaff && (
                    <Space>
                      <Select
                        value={ticket.priority}
                        onChange={handlePriorityChange}
                        style={{ width: 120 }}
                        options={priorityOptions}
                        loading={updatingPriority}
                        placeholder="Set Priority"
                      />
                      <Select
                        value={ticket.status}
                        onChange={handleStatusChange}
                        style={{ width: 120 }}
                        options={statusOptions}
                        loading={updatingStatus}
                        placeholder="Set Status"
                      />
                      {!ticket.assigned_to && (
                        <Button type="primary" onClick={handleAssignToMe} loading={assigning}>
                          Assign to Me
                        </Button>
                      )}
                      {ticket.assigned_to && (
                        <Tag color="blue">
                          Assigned to:{' '}
                          {ticket.assignee?.name || ticket.assignee?.email || 'Unknown'}
                        </Tag>
                      )}
                    </Space>
                  )}
                  {!isStaff && (
                    <>
                      <Tag
                        color={
                          ticket.priority === 'low'
                            ? 'green'
                            : ticket.priority === 'medium'
                              ? 'blue'
                              : ticket.priority === 'high'
                                ? 'orange'
                                : 'red'
                        }
                      >
                        {ticket.priority.toUpperCase()}
                      </Tag>
                      <Tag
                        color={
                          ticket.status === 'open'
                            ? 'blue'
                            : ticket.status === 'in_progress'
                              ? 'orange'
                              : 'green'
                        }
                      >
                        {ticket.status.toUpperCase()}
                      </Tag>
                    </>
                  )}
                </Space>
              </div>

              <Space size="large">
                <Text type="secondary">
                  Created by: {ticket.creator.name || ticket.creator.email}
                </Text>
                <Text type="secondary">
                  Created: {new Date(ticket.created_at).toLocaleString()}
                </Text>
                <Text type="secondary">
                  Last updated: {new Date(ticket.updated_at).toLocaleString()}
                </Text>
              </Space>

              {ticket.description && (
                <Text style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Text>
              )}
            </Space>
          </Card>
        </div>

        {/* Messages section */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Card
            title="Messages"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            bodyStyle={{
              height: '100%',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Scrollable messages area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 24px 0',
                minHeight: 0,
              }}
            >
              {messages.length > 0 ? (
                <>
                  <Timeline
                    items={messages.map((msg) => ({
                      color: msg.type === 'history' ? 'blue' : undefined,
                      children: (
                        <div
                          key={msg.id}
                          style={{
                            padding: '12px',
                            background: msg.type === 'history' ? 'rgba(0, 0, 0, 0.02)' : undefined,
                            borderRadius: '4px',
                            borderLeft: msg.type === 'history' ? '3px solid #1890ff' : undefined,
                          }}
                        >
                          <div style={{ marginBottom: 8 }}>
                            <Text strong>{msg.user?.name || msg.user?.email || 'System'}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              {new Date(msg.created_at).toLocaleString()}
                            </Text>
                          </div>
                          <Text>
                            {msg.type === 'history' ? (
                              <Text type="secondary" italic>
                                {msg.content}
                              </Text>
                            ) : (
                              msg.content
                            )}
                          </Text>
                        </div>
                      ),
                    }))}
                  />
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <Text type="secondary">No messages yet</Text>
              )}
            </div>

            {/* Fixed message input area */}
            <div
              style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '24px',
                backgroundColor: 'inherit',
              }}
            >
              <Form form={form} onFinish={handleSendMessage}>
                <Form.Item
                  name="content"
                  rules={[{ required: true, message: 'Please enter a message' }]}
                >
                  <TextArea rows={4} placeholder="Type your message here..." />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Button type="primary" htmlType="submit" loading={sending}>
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Card>
        </div>
      </div>

      {/* Agent Comments Sidebar - only visible to staff */}
      {isStaff && (
        <div
          style={{
            width: 400,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Card
            title="Agent Comments"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            bodyStyle={{
              height: '100%',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Scrollable comments area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 24px 0',
                minHeight: 0,
              }}
            >
              {comments.length > 0 ? (
                <>
                  <Timeline
                    items={comments.map((comment) => ({
                      children: (
                        <div
                          key={comment.message_id}
                          style={{
                            padding: '12px',
                            background: 'rgba(24, 144, 255, 0.1)',
                            borderRadius: 6,
                            borderLeft: '3px solid #1890ff',
                          }}
                        >
                          <div style={{ marginBottom: 8 }}>
                            <Text strong>
                              {comment.user?.name || comment.user?.email || 'Unknown'}
                            </Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              {new Date(comment.created_at).toLocaleString()}
                            </Text>
                          </div>
                          <Text>{comment.content}</Text>
                        </div>
                      ),
                    }))}
                  />
                  <div ref={commentsEndRef} />
                </>
              ) : (
                <Text type="secondary">No agent comments yet</Text>
              )}
            </div>

            {/* Fixed comment input area */}
            <div
              style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '24px',
                backgroundColor: 'inherit',
              }}
            >
              <Form form={commentForm} onFinish={handleSendComment}>
                <Form.Item
                  name="content"
                  rules={[{ required: true, message: 'Please enter a comment' }]}
                >
                  <TextArea rows={4} placeholder="Add an internal comment..." />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Button type="primary" htmlType="submit" loading={sendingComment}>
                    Add Comment
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Card>
        </div>
      )}

      <Modal
        title="Close Ticket"
        open={closeModalVisible}
        onOk={confirmCloseTicket}
        onCancel={() => setCloseModalVisible(false)}
        okText="Close"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to close this ticket? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}
