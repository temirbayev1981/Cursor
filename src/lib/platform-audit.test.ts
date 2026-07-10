import { describe, it, expect, beforeEach } from 'vitest'
import { computePlatformAudit } from './platform-audit'
import { PORTAL_RPC_ENFORCED } from '@/services/portal-data-service'
import { STRIPE_WEBHOOK_AUDIT } from '@/services/billing-service'
import { INVENTORY_AUDIT } from '@/services/inventory-service'
import { ONBOARDING_AUDIT } from '@/services/onboarding-service'
import { AUDIT_I18N_COVERAGE } from '@/lib/audit-labels'
import { TYPED_SUPABASE_QUERIES } from '@/lib/supabase-queries'
import { MULTI_TENANT_SUPPORTED, MULTI_TENANT_MEMBERSHIP_RPC } from '@/services/company-service'

describe('platform-audit', () => {
  beforeEach(() => {
    localStorage.setItem('handymanos_locale', 'en')
  })

  it('returns combined audit score and recommendation ids', () => {
    const report = computePlatformAudit()
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(10)
    expect(report.integrationScore).toBeGreaterThanOrEqual(0)
    expect(report.qualityScore).toBeGreaterThanOrEqual(0)
    expect(report.recommendationIds.length).toBeGreaterThan(0)
    expect(report.summaryKey).toMatch(/^(ready|needs_config)$/)
    expect(report.grade).toMatch(/^[A-C][+-]?$/)
  })

  it('includes observability recommendation when unset', () => {
    const report = computePlatformAudit()
    const hasObservabilityRec = report.recommendationIds.includes('observability')
    const allReady = report.recommendationIds.includes('all_ready')
    expect(hasObservabilityRec || allReady).toBe(true)
  })

  it('requires connect_supabase when live Supabase env is missing', () => {
    const report = computePlatformAudit()
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      expect(report.recommendationIds).toContain('connect_supabase')
      expect(report.summaryKey).toBe('needs_config')
      expect(report.readyForProduction).toBe(false)
    }
  })

  it('uses compile-time quality gate constants', () => {
    expect(PORTAL_RPC_ENFORCED).toBe(true)
    expect(STRIPE_WEBHOOK_AUDIT).toBe(true)
    expect(AUDIT_I18N_COVERAGE).toBe(true)
    expect(INVENTORY_AUDIT).toBe(true)
    expect(ONBOARDING_AUDIT).toBe(true)
    expect(TYPED_SUPABASE_QUERIES).toBe(true)
    expect(MULTI_TENANT_SUPPORTED).toBe(true)
    expect(MULTI_TENANT_MEMBERSHIP_RPC).toBe('get_accessible_companies')

    const report = computePlatformAudit()
    const typed = report.checks.find((check) => check.id === 'typed_data')
    const portal = report.checks.find((check) => check.id === 'portal_rpc')
    const stripeAudit = report.checks.find((check) => check.id === 'stripe_webhook_audit')
    const auditI18n = report.checks.find((check) => check.id === 'audit_i18n')
    const inventoryAudit = report.checks.find((check) => check.id === 'inventory_audit')
    const onboardingAudit = report.checks.find((check) => check.id === 'onboarding_audit')
    const multi = report.checks.find((check) => check.id === 'multi_tenant')
    const liveBackend = report.checks.find((check) => check.id === 'live_backend')

    expect(typed?.ok).toBe(Boolean(liveBackend?.ok))
    expect(portal?.ok).toBe(Boolean(liveBackend?.ok))
    expect(stripeAudit?.ok).toBe(Boolean(liveBackend?.ok))
    expect(auditI18n?.ok).toBe(Boolean(liveBackend?.ok))
    expect(inventoryAudit?.ok).toBe(Boolean(liveBackend?.ok))
    expect(onboardingAudit?.ok).toBe(Boolean(liveBackend?.ok))
    expect(multi?.ok).toBe(Boolean(liveBackend?.ok))
  })
})
