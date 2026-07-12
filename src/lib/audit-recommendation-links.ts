import type { AuditRecommendationId } from '@/lib/platform-audit'
import type { IntegrationKey } from '@/components/settings/settings-integrations-panel'

/** Maps platform audit recommendations to Settings → Integrations cards. */
export const AUDIT_RECOMMENDATION_INTEGRATION: Partial<Record<AuditRecommendationId, IntegrationKey>> = {
  connect_supabase: 'supabase',
  configure_stripe: 'stripe',
  enable_email: 'email',
  enable_sms: 'sms',
  configure_openai: 'openai',
  configure_maps: 'maps',
  observability: 'observability',
}

export function integrationKeyForRecommendation(id: AuditRecommendationId): IntegrationKey | null {
  return AUDIT_RECOMMENDATION_INTEGRATION[id] ?? null
}
