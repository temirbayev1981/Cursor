type ErrorReport = {
  message: string
  stack?: string
  url: string
  timestamp: string
  componentStack?: string
}

const REPORTS_KEY = 'handymanos_error_reports'
const MAX_REPORTS = 50

function saveReport(report: ErrorReport) {
  try {
    const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]') as ErrorReport[]
    reports.unshift(report)
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, MAX_REPORTS)))
  } catch {
    // ignore storage errors
  }
}

async function sendToWebhook(report: ErrorReport) {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  try {
    await fetch(dsn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: crypto.randomUUID(),
        timestamp: report.timestamp,
        message: report.message,
        exception: { values: [{ type: 'Error', value: report.message, stacktrace: report.stack }] },
        request: { url: report.url },
      }),
    })
  } catch {
    // silent fail for observability
  }
}

export function captureError(error: Error, componentStack?: string) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    componentStack,
  }
  saveReport(report)
  if (import.meta.env.DEV) {
    console.error('[Observability]', report)
  }
  void sendToWebhook(report)
}

export function initObservability() {
  window.addEventListener('error', (event) => {
    captureError(event.error ?? new Error(event.message))
  })
  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    captureError(err)
  })
}

export function getErrorReports(): ErrorReport[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]') as ErrorReport[]
  } catch {
    return []
  }
}
