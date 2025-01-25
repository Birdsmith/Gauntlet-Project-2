'use client'

import { TicketDetail } from '@autocrm/common'
import { useParams, useRouter } from 'next/navigation'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  return (
    <TicketDetail
      ticketId={ticketId}
      userRole="customer"
      onBack={() => router.push('/tickets')}
    />
  )
}
