'use client'

import { TicketDetail } from '@autocrm/common'
import { useRouter } from 'next/navigation'
import { useUser } from '@supabase/auth-helpers-react'

interface TicketDetailPageProps {
  params: {
    id: string
  }
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter()
  const user = useUser()

  if (!user) {
    return null // or loading state
  }

  return (
    <TicketDetail
      ticketId={params.id}
      userRole="agent"
      onBack={() => router.push('/tickets')}
    />
  )
}
