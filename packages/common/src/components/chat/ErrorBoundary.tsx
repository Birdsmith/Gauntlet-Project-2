import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Alert
            message="Error"
            description="Something went wrong. Please try again."
            type="error"
            showIcon
            style={{ margin: '16px' }}
          />
        )
      )
    }

    return this.props.children
  }
}
