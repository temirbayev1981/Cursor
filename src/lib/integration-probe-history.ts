import {
  summarizeIntegrationProbes,
  type IntegrationProbeSummary,
} from '@/lib/integration-probe-ui'
import { hasSupabase, isE2eMockBackend } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import type { Database, Json } from '@/types/database'

type IntegrationProbeRunRow = Database['public']['Tables']['integration_probe_runs']['Row']

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

export async function syncIntegrationProbeHistoryToSupabase(
  companyId: string,
  entry: IntegrationProbeHistoryEntry,
): Promise<void> {
  if (!hasSupabase || isE2eMockBackend || !supabase) return
  try {
    const row: Database['public']['Tables']['integration_probe_runs']['Insert'] = {
      company_id: companyId,
      checked_at: entry.checkedAt,
      results: entry.results as Json,
      summary: entry.summary as unknown as Json,
    }
    await supabase.from('integration_probe_runs').insert(row as never)
  } catch {
    // optional cloud sync
  }
}

export async function loadIntegrationProbeHistoryMerged(companyId: string): Promise<IntegrationProbeHistoryEntry[]> {
  const local = loadIntegrationProbeHistory()
  if (!hasSupabase || isE2eMockBackend || !supabase) return local

  try {
    const { data } = await supabase
      .from('integration_probe_runs')
      .select('checked_at, results, summary')
      .eq('company_id', companyId)
      .order('checked_at', { ascending: false })
      .limit(MAX_HISTORY)

    const rows = (data ?? []) as Pick<IntegrationProbeRunRow, 'checked_at' | 'results' | 'summary'>[]
    if (!rows.length) return local

    const remote = rows.map((row) => ({
      checkedAt: row.checked_at,
      results: row.results as Record<string, boolean | null>,
      summary: row.summary as unknown as IntegrationProbeSummary,
    }))

    const seen = new Set<string>()
    const merged: IntegrationProbeHistoryEntry[] = []
    for (const entry of [...local, ...remote]) {
      if (seen.has(entry.checkedAt)) continue
      seen.add(entry.checkedAt)
      merged.push(entry)
    }
    return merged.slice(0, MAX_HISTORY)
  } catch {
    return local
  }
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
