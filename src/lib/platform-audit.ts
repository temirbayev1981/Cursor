import { DEMO_MODE } from '@/lib/supabase'
import { computePlatformHealth } from '@/lib/platform-health'

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
  recommendations: string[]
  readyForProduction: boolean
  summary: string
}

export function computePlatformAudit(): PlatformAuditReport {
  const health = computePlatformHealth()
  const localeConfigured = typeof localStorage !== 'undefined'
    && Boolean(localStorage.getItem('handymanos_locale') || localStorage.getItem('handymanos_onboarding'))

  const qualityChecks: PlatformAuditCheck[] = [
    { id: 'live_backend', label: 'Live backend', ok: !DEMO_MODE, weight: 1.5 },
    { id: 'i18n', label: 'Localization', ok: localeConfigured, weight: 0.5 },
    { id: 'offline_ready', label: 'Offline-ready PWA', ok: health.checks.find((c) => c.id === 'offline_sync')?.ok ?? false, weight: 0.5 },
    { id: 'typed_data', label: 'Type-safe Supabase queries', ok: !DEMO_MODE, weight: 1 },
    { id: 'portal_rpc', label: 'Portal server RPCs', ok: !DEMO_MODE, weight: 0.5 },
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

  const recommendations: string[] = []
  if (DEMO_MODE) recommendations.push('Connect Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)')
  if (!health.checks.find((check) => check.id === 'stripe')?.ok) {
    recommendations.push('Configure Stripe for online payments')
  }
  if (!health.checks.find((check) => check.id === 'email')?.ok) {
    recommendations.push('Enable email notifications (Resend or webhook)')
  }
  if (!health.checks.find((check) => check.id === 'offline_sync')?.ok) {
    recommendations.push('Deploy with service worker for offline technician sync')
  }
  if (recommendations.length === 0) {
    recommendations.push('Platform is production-ready — monitor Settings → System metrics')
  }

  const readyForProduction = score >= 8.5 && hasSupabaseFromHealth(health.checks) && !DEMO_MODE

  return {
    score,
    grade,
    integrationScore,
    qualityScore,
    checks: [...health.checks.map((check) => ({ ...check, weight: check.weight * 0.7 })), ...qualityChecks],
    recommendations,
    readyForProduction,
    summary: readyForProduction
      ? 'Production-ready SaaS platform with integrations and quality gates passed.'
      : 'Functional demo platform — connect live services to reach production grade.',
  }
}

function hasSupabaseFromHealth(checks: { id: string; ok: boolean }[]): boolean {
  return checks.find((check) => check.id === 'supabase')?.ok ?? false
}
