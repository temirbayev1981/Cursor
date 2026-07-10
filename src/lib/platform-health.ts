import {
  hasSupabase,
  hasStripe,
  hasGoogleMaps,
  hasOpenAI,
  hasNotificationConfigured,
  hasSmsConfigured,
  hasObservability,
  isE2eMockBackend,
} from '@/lib/env'
import { isBackendConfigured } from '@/lib/supabase'
import { hasPwaManifestLink, isOfflineSyncReady, isPwaApiSupported, isServiceWorkerRegistered } from '@/lib/pwa'

export interface PlatformHealthCheck {
  id: string
  label: string
  ok: boolean
  weight: number
}

export interface PlatformHealthReport {
  score: number
  grade: string
  checks: PlatformHealthCheck[]
  readyForProduction: boolean
}

export interface PlatformHealthOptions {
  /** Live reachability from Settings → Integrations probes. */
  probeResults?: Record<string, boolean | null>
  /** Service worker active — refreshes offline_sync after async registration. */
  serviceWorkerReady?: boolean
  /** Integration probe history recorded (Settings → System). */
  probeHistoryReady?: boolean
}

function integrationOk(
  configured: boolean,
  probeId: string,
  probeResults?: Record<string, boolean | null>,
): boolean {
  if (!configured) return false
  const probe = probeResults?.[probeId]
  if (probe === false) return false
  return true
}

export function computePlatformHealth(options: PlatformHealthOptions = {}): PlatformHealthReport {
  const { probeResults, serviceWorkerReady } = options
  const pwaReady = isPwaApiSupported() && hasPwaManifestLink()
  const swActive = isServiceWorkerRegistered() || serviceWorkerReady === true
  const offlineReady = isOfflineSyncReady() || (swActive && pwaReady && typeof localStorage !== 'undefined')

  const checks: PlatformHealthCheck[] = [
    { id: 'supabase', label: 'Supabase', ok: integrationOk(hasSupabase, 'supabase', probeResults), weight: 2 },
    { id: 'data_mode', label: 'Live data mode', ok: isBackendConfigured, weight: 1 },
    { id: 'stripe', label: 'Stripe', ok: integrationOk(hasStripe, 'stripe', probeResults), weight: 1.5 },
    { id: 'email', label: 'Email', ok: integrationOk(hasNotificationConfigured, 'email', probeResults), weight: 1 },
    { id: 'sms', label: 'SMS', ok: integrationOk(hasSmsConfigured, 'sms', probeResults), weight: 1 },
    { id: 'openai', label: 'OpenAI', ok: integrationOk(hasOpenAI, 'openai', probeResults), weight: 1 },
    { id: 'maps', label: 'Google Maps', ok: integrationOk(hasGoogleMaps, 'maps', probeResults), weight: 0.5 },
    { id: 'observability', label: 'Observability', ok: integrationOk(hasObservability, 'observability', probeResults), weight: 0.5 },
    { id: 'pwa', label: 'PWA', ok: pwaReady, weight: 0.5 },
    { id: 'offline_sync', label: 'Offline sync', ok: offlineReady, weight: 0.5 },
  ]

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
  const earned = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0)
  const ratio = totalWeight > 0 ? earned / totalWeight : 0
  const score = Math.round(ratio * 100) / 10

  const grade =
    score >= 9 ? 'A' :
    score >= 8 ? 'B+' :
    score >= 7 ? 'B' :
    score >= 6 ? 'C+' :
    'C'

  return {
    score,
    grade,
    checks,
    readyForProduction: score >= 8 && hasSupabase && !isE2eMockBackend,
  }
}

/** True when every probed integration that is configured reports reachable. */
export function integrationProbesPass(probeResults?: Record<string, boolean | null>): boolean {
  if (!probeResults) return true
  const probed = Object.entries(probeResults).filter(([, reachable]) => reachable !== null)
  if (probed.length === 0) return true
  return probed.every(([, reachable]) => reachable === true)
}
