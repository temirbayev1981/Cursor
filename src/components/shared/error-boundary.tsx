import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { captureError } from '@/lib/observability'
import { en } from '@/i18n/locales/en'
import { ru } from '@/i18n/locales/ru'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

function errorCopy() {
  const locale = localStorage.getItem('handymanos_locale')
  return locale === 'en' ? en.common : ru.common
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
      const copy = errorCopy()
      return (
        <div className="gradient-bg flex min-h-[100dvh] items-center justify-center p-6">
          <div className="glass-card max-w-md space-y-4 p-8 text-center" role="alert">
            <h1 className="text-xl font-bold">{copy.errorTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || copy.errorUnknown}
            </p>
            <Button onClick={() => window.location.reload()}>{copy.reload}</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
