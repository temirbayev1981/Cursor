import { getAIFallbacks } from '@/i18n/ai-fallbacks'
import type { Locale } from '@/contexts/locale-context'
import type { AiBusinessContextStats } from '@/services/entity-service'

export const EMPTY_AI_BUSINESS_CONTEXT: AiBusinessContextStats = {
  customerCount: 0,
  jobCount: 0,
  openJobs: 0,
  revenue: 0,
  profit: 0,
  outstanding: 0,
}

export function buildBusinessContext(
  stats: AiBusinessContextStats,
  locale: Locale = 'en',
): string {
  const { businessSnapshot } = getAIFallbacks(locale)
  return businessSnapshot
    .replace('{customers}', String(stats.customerCount))
    .replace('{jobs}', String(stats.jobCount))
    .replace('{openJobs}', String(stats.openJobs))
    .replace('{revenue}', stats.revenue.toFixed(0))
    .replace('{profit}', stats.profit.toFixed(0))
    .replace('{outstanding}', stats.outstanding.toFixed(0))
}
