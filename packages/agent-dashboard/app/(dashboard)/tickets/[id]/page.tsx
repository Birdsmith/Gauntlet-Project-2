'use client'

import { useRouter } from 'next/navigation'
import { TicketDetail } from '@autocrm/common'

export default function TicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()

  return (
    <TicketDetail
      ticketId={params.id}
      userRole="agent"
      onBack={() => router.push('/tickets')}
    />
  )
}
