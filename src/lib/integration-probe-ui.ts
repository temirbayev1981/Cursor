import {
  hasGoogleMaps,
  hasNotificationConfigured,
  hasObservability,
  hasOpenAI,
  hasSmsConfigured,
  hasStripe,
  hasSupabase,
  isE2eMockBackend,
} from '@/lib/env'
import { probeLiveIntegrations, type IntegrationProbe } from '@/lib/platform-probes'

export const INTEGRATION_PROBE_IDS = [
  'stripe',
  'supabase',
  'openai',
  'email',
  'sms',
  'maps',
  'observability',
] as const

export type IntegrationProbeId = (typeof INTEGRATION_PROBE_IDS)[number]

export function isIntegrationConfigured(id: IntegrationProbeId): boolean {
  switch (id) {
    case 'stripe':
      return hasStripe
    case 'supabase':
      return hasSupabase
    case 'openai':
      return hasOpenAI
    case 'email':
      return hasNotificationConfigured
    case 'sms':
      return hasSmsConfigured
    case 'maps':
      return hasGoogleMaps
    case 'observability':
      return hasObservability
    default:
      return false
  }
}

/** Synthetic reachable probes for Playwright (no live network calls). */
export function buildSyntheticE2eProbes(): IntegrationProbe[] {
  return INTEGRATION_PROBE_IDS.map((id) => ({
    id,
    reachable: isIntegrationConfigured(id) ? true : null,
  }))
}

export function probesToRecord(probes: IntegrationProbe[]): Record<string, boolean | null> {
  const map: Record<string, boolean | null> = {}
  for (const probe of probes) {
    map[probe.id] = probe.reachable
  }
  return map
}

/** Live probes in production; synthetic probes in E2E mock for UI coverage. */
export async function probeIntegrationsForSettings(): Promise<IntegrationProbe[]> {
  if (isE2eMockBackend) return buildSyntheticE2eProbes()
  return probeLiveIntegrations()
}

export interface IntegrationProbeSummary {
  live: number
  total: number
  unreachable: number
}

export function summarizeIntegrationProbes(
  probeResults: Record<string, boolean | null | undefined>,
): IntegrationProbeSummary {
  let live = 0
  let total = 0
  let unreachable = 0

  for (const id of INTEGRATION_PROBE_IDS) {
    if (!isIntegrationConfigured(id)) continue
    const reachable = probeResults[id]
    if (reachable === null || reachable === undefined) continue
    total++
    if (reachable) live++
    else unreachable++
  }

  return { live, total, unreachable }
}

/** True when Settings has run probes and at least one configured integration was checked. */
export function integrationProbeUiReady(
  probeResults?: Record<string, boolean | null | undefined>,
): boolean {
  if (!probeResults) return false
  return summarizeIntegrationProbes(probeResults).total > 0
}
