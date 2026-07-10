import {
  hasSupabase,
  hasStripe,
  hasGoogleMaps,
  hasOpenAI,
  hasNotificationConfigured,
  hasSmsConfigured,
} from '@/lib/env'

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

export function computePlatformHealth(): PlatformHealthReport {
  const checks: PlatformHealthCheck[] = [
    { id: 'supabase', label: 'Supabase', ok: hasSupabase, weight: 2 },
    { id: 'stripe', label: 'Stripe', ok: hasStripe, weight: 1.5 },
    { id: 'email', label: 'Email', ok: hasNotificationConfigured, weight: 1 },
    { id: 'sms', label: 'SMS', ok: hasSmsConfigured, weight: 1 },
    { id: 'openai', label: 'OpenAI', ok: hasOpenAI, weight: 1 },
    { id: 'maps', label: 'Google Maps', ok: hasGoogleMaps, weight: 0.5 },
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
    readyForProduction: score >= 7 && hasSupabase,
  }
}
