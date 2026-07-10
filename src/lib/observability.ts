type ErrorReport = {
  message: string
  stack?: string
  url: string
  timestamp: string
  componentStack?: string
}

const REPORTS_KEY = 'handymanos_error_reports'
const MAX_REPORTS = 50

let sentryReady = false

function saveReport(report: ErrorReport) {
  try {
    const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]') as ErrorReport[]
    reports.unshift(report)
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, MAX_REPORTS)))
  } catch {
    // ignore storage errors
  }
}

async function initSentry(dsn: string) {
  try {
    const Sentry = await import('@sentry/react')
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: `handymanos-ai@${import.meta.env.VITE_APP_VERSION ?? '1.3.0'}`,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    })
    sentryReady = true
  } catch {
    sentryReady = false
  }
}

async function sendToSentrySdk(error: Error, componentStack?: string) {
  if (!sentryReady) return
  try {
    const Sentry = await import('@sentry/react')
    Sentry.captureException(error, {
      contexts: componentStack ? { react: { componentStack } } : undefined,
    })
  } catch {
    // silent fail for observability
  }
}

function parseSentryDsn(dsn: string): { storeUrl: string; publicKey: string } | null {
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const projectId = url.pathname.replace(/^\//, '')
    if (!publicKey || !projectId) return null
    return {
      storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/`,
      publicKey,
    }
  } catch {
    return null
  }
}

async function sendToSentryStore(report: ErrorReport, dsn: string) {
  const parsed = parseSentryDsn(dsn)
  if (!parsed) return

  try {
    await fetch(parsed.storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=handymanos/1.0, sentry_key=${parsed.publicKey}`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: report.timestamp,
        platform: 'javascript',
        message: report.message,
        exception: {
          values: [{
            type: 'Error',
            value: report.message,
            stacktrace: report.stack ? { frames: [{ filename: report.url, function: '?' }] } : undefined,
          }],
        },
        request: { url: report.url },
      }),
    })
  } catch {
    // silent fail for observability
  }
}

async function sendToWebhook(report: ErrorReport, webhookUrl: string) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
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

  void sendToSentrySdk(error, componentStack)

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  const webhookUrl = import.meta.env.VITE_ERROR_WEBHOOK_URL as string | undefined

  if (!sentryReady && sentryDsn) void sendToSentryStore(report, sentryDsn)
  else if (webhookUrl) void sendToWebhook(report, webhookUrl)
}

export async function initObservability() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (sentryDsn) {
    await initSentry(sentryDsn)
  }

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

export type { ErrorReport }
