'use client'

import { LoginForm } from '@autocrm/common'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/')
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Login</h1>
      <LoginForm onSuccess={handleSuccess} />
    </div>
  )
}
