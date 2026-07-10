import {
  summarizeIntegrationProbes,
  type IntegrationProbeSummary,
} from '@/lib/integration-probe-ui'

export interface IntegrationProbeHistoryEntry {
  checkedAt: string
  results: Record<string, boolean | null>
  summary: IntegrationProbeSummary
}

const HISTORY_KEY = 'handymanos_integration_probe_history'
const MAX_HISTORY = 10

export function loadIntegrationProbeHistory(): IntegrationProbeHistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as IntegrationProbeHistoryEntry[]
  } catch {
    return []
  }
}

export function saveIntegrationProbeHistory(
  results: Record<string, boolean | null>,
): IntegrationProbeHistoryEntry {
  const entry: IntegrationProbeHistoryEntry = {
    checkedAt: new Date().toISOString(),
    results,
    summary: summarizeIntegrationProbes(results),
  }

  if (typeof localStorage !== 'undefined') {
    const history = loadIntegrationProbeHistory()
    history.unshift(entry)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  }

  return entry
}

export function getLatestIntegrationProbeHistory(): IntegrationProbeHistoryEntry | null {
  return loadIntegrationProbeHistory()[0] ?? null
}

export function hasIntegrationProbeHistory(): boolean {
  return loadIntegrationProbeHistory().length > 0
}

export function clearIntegrationProbeHistory(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(HISTORY_KEY)
  }
}
