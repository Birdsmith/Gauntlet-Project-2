'use client'

import { ThemeProvider } from '@autocrm/common'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <ThemeProvider>{children}</ThemeProvider>
}
