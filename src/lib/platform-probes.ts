import {
  env,
  getNotificationEndpoint,
  getOpenAIEndpoint,
  getSmsEndpoint,
  getStripeCheckoutEndpoint,
  getStripeSubscriptionEndpoint,
  hasGoogleMaps,
  hasObservability,
  hasSupabase,
} from '@/lib/env'
import { getSentryProbeUrl } from '@/lib/observability'

export interface IntegrationProbe {
  id: string
  reachable: boolean | null
}

const REACHABLE_STATUSES = new Set([200, 204, 401, 405])

export async function probeIntegrationEndpoint(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'OPTIONS', mode: 'cors' })
    if (REACHABLE_STATUSES.has(res.status) || res.ok) return true
  } catch {
    // OPTIONS may be blocked — fall through to GET
  }

  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors' })
    return REACHABLE_STATUSES.has(res.status) || res.ok
  } catch {
    return false
  }
}

async function probeStripe(): Promise<IntegrationProbe> {
  const checkout = getStripeCheckoutEndpoint()
  const subscription = getStripeSubscriptionEndpoint()
  if (!checkout && !subscription) return { id: 'stripe', reachable: null }

  const results = await Promise.all([
    checkout ? probeIntegrationEndpoint(checkout) : Promise.resolve(false),
    subscription ? probeIntegrationEndpoint(subscription) : Promise.resolve(false),
  ])
  return { id: 'stripe', reachable: results.some(Boolean) }
}

async function probeSupabase(): Promise<IntegrationProbe> {
  if (!hasSupabase || !env.VITE_SUPABASE_URL) return { id: 'supabase', reachable: null }
  const ok = await probeIntegrationEndpoint(`${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`)
  return { id: 'supabase', reachable: ok }
}

async function probeConfiguredEndpoint(id: string, url?: string): Promise<IntegrationProbe> {
  if (!url) return { id, reachable: null }
  const ok = await probeIntegrationEndpoint(url)
  return { id, reachable: ok }
}

async function probeMaps(): Promise<IntegrationProbe> {
  if (!hasGoogleMaps || !env.VITE_GOOGLE_MAPS_API_KEY) {
    return { id: 'maps', reachable: null }
  }
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=1x1&key=${encodeURIComponent(env.VITE_GOOGLE_MAPS_API_KEY)}`
  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors' })
    return { id: 'maps', reachable: res.ok || res.status === 403 }
  } catch {
    return { id: 'maps', reachable: false }
  }
}

async function probeSentryDsn(dsn: string): Promise<boolean> {
  const url = getSentryProbeUrl(dsn)
  if (!url) return false
  return probeIntegrationEndpoint(url)
}

async function probeObservability(): Promise<IntegrationProbe> {
  if (!hasObservability) return { id: 'observability', reachable: null }

  const tasks: Promise<boolean>[] = []
  if (env.VITE_ERROR_WEBHOOK_URL) {
    tasks.push(probeIntegrationEndpoint(env.VITE_ERROR_WEBHOOK_URL))
  }
  if (env.VITE_SENTRY_DSN) {
    tasks.push(probeSentryDsn(env.VITE_SENTRY_DSN))
  }
  if (tasks.length === 0) return { id: 'observability', reachable: null }

  const results = await Promise.all(tasks)
  return { id: 'observability', reachable: results.every(Boolean) }
}

/** Async reachability checks for configured integration endpoints (Settings → Integrations). */
export async function probeLiveIntegrations(): Promise<IntegrationProbe[]> {
  return Promise.all([
    probeStripe(),
    probeSupabase(),
    probeConfiguredEndpoint('openai', getOpenAIEndpoint()),
    probeConfiguredEndpoint('email', getNotificationEndpoint()),
    probeConfiguredEndpoint('sms', getSmsEndpoint()),
    probeMaps(),
    probeObservability(),
  ])
}
