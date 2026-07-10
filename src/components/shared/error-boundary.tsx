import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { captureError } from '@/lib/observability'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, info.componentStack ?? undefined)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center gradient-bg p-6">
          <div className="glass-card p-8 max-w-md text-center space-y-4">
            <h1 className="text-xl font-bold">Что-то пошло не так</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
            <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
