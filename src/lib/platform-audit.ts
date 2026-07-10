import { hasSupabase, isE2eMockBackend } from '@/lib/env'
import { computePlatformHealth } from '@/lib/platform-health'
import { TYPED_SUPABASE_QUERIES } from '@/lib/supabase-queries'
import { MULTI_TENANT_SUPPORTED, MULTI_TENANT_MEMBERSHIP_RPC } from '@/services/company-service'
import { PORTAL_RPC_ENFORCED } from '@/services/portal-data-service'
import { STRIPE_WEBHOOK_AUDIT } from '@/services/billing-service'

export type AuditRecommendationId =
  | 'connect_supabase'
  | 'configure_stripe'
  | 'enable_email'
  | 'enable_sms'
  | 'configure_openai'
  | 'configure_maps'
  | 'offline_sync'
  | 'observability'
  | 'all_ready'

export type AuditSummaryKey = 'ready' | 'needs_config'

export interface PlatformAuditCheck {
  id: string
  label: string
  ok: boolean
  weight: number
}

export interface PlatformAuditReport {
  score: number
  grade: string
  integrationScore: number
  qualityScore: number
  checks: PlatformAuditCheck[]
  recommendationIds: AuditRecommendationId[]
  summaryKey: AuditSummaryKey
  readyForProduction: boolean
}

export function computePlatformAudit(): PlatformAuditReport {
  const health = computePlatformHealth()
  const localeConfigured = typeof localStorage !== 'undefined'
    && Boolean(localStorage.getItem('handymanos_locale'))

  const liveBackend = hasSupabase && !isE2eMockBackend

  const qualityChecks: PlatformAuditCheck[] = [
    { id: 'live_backend', label: 'Live backend', ok: liveBackend, weight: 1.5 },
    { id: 'i18n', label: 'Localization', ok: localeConfigured, weight: 0.5 },
    { id: 'offline_ready', label: 'Offline-ready PWA', ok: health.checks.find((c) => c.id === 'offline_sync')?.ok ?? false, weight: 0.5 },
    { id: 'typed_data', label: 'Type-safe Supabase queries', ok: liveBackend && TYPED_SUPABASE_QUERIES, weight: 1 },
    { id: 'portal_rpc', label: 'Portal server RPCs', ok: liveBackend && PORTAL_RPC_ENFORCED, weight: 0.5 },
    { id: 'stripe_webhook_audit', label: 'Stripe webhook audit', ok: liveBackend && STRIPE_WEBHOOK_AUDIT, weight: 0.5 },
    { id: 'multi_tenant', label: 'Multi-company membership', ok: liveBackend && MULTI_TENANT_SUPPORTED && Boolean(MULTI_TENANT_MEMBERSHIP_RPC), weight: 0.5 },
  ]

  const qualityWeight = qualityChecks.reduce((sum, check) => sum + check.weight, 0)
  const qualityEarned = qualityChecks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0)
  const qualityScore = qualityWeight > 0
    ? Math.round((qualityEarned / qualityWeight) * 100) / 10
    : 0

  const integrationScore = health.score
  const combined = Math.round(((integrationScore * 0.7) + (qualityScore * 0.3)) * 10) / 10
  const score = Math.min(10, combined)

  const grade =
    score >= 9 ? 'A' :
    score >= 8.5 ? 'A-' :
    score >= 8 ? 'B+' :
    score >= 7 ? 'B' :
    score >= 6 ? 'C+' :
    'C'

  const recommendationIds: AuditRecommendationId[] = []
  if (!liveBackend) recommendationIds.push('connect_supabase')
  if (!health.checks.find((check) => check.id === 'stripe')?.ok) {
    recommendationIds.push('configure_stripe')
  }
  if (!health.checks.find((check) => check.id === 'email')?.ok) {
    recommendationIds.push('enable_email')
  }
  if (!health.checks.find((check) => check.id === 'sms')?.ok) {
    recommendationIds.push('enable_sms')
  }
  if (!health.checks.find((check) => check.id === 'openai')?.ok) {
    recommendationIds.push('configure_openai')
  }
  if (!health.checks.find((check) => check.id === 'maps')?.ok) {
    recommendationIds.push('configure_maps')
  }
  if (!health.checks.find((check) => check.id === 'offline_sync')?.ok) {
    recommendationIds.push('offline_sync')
  }
  if (!health.checks.find((check) => check.id === 'observability')?.ok) {
    recommendationIds.push('observability')
  }
  if (recommendationIds.length === 0) {
    recommendationIds.push('all_ready')
  }

  const readyForProduction = score >= 8.5 && hasSupabaseFromHealth(health.checks) && liveBackend

  return {
    score,
    grade,
    integrationScore,
    qualityScore,
    checks: [...health.checks.map((check) => ({ ...check, weight: check.weight * 0.7 })), ...qualityChecks],
    recommendationIds,
    summaryKey: readyForProduction ? 'ready' : 'needs_config',
    readyForProduction,
  }
}

function hasSupabaseFromHealth(checks: { id: string; ok: boolean }[]): boolean {
  return checks.find((check) => check.id === 'supabase')?.ok ?? false
}
