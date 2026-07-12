import { getAIFallbacks } from '@/i18n/ai-fallbacks'
import type { Locale } from '@/contexts/locale-context'

export function buildBusinessContext(
  data: {
    jobs: import('@/types').Job[]
    invoices: import('@/types').Invoice[]
    customers: import('@/types').Customer[]
  },
  locale: Locale = 'en',
): string {
  const revenue = data.jobs.reduce((s, j) => s + j.revenue, 0)
  const profit = data.jobs.reduce((s, j) => s + j.profit, 0)
  const openJobs = data.jobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length
  const outstanding = data.invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const { businessSnapshot } = getAIFallbacks(locale)
  return businessSnapshot
    .replace('{customers}', String(data.customers.length))
    .replace('{jobs}', String(data.jobs.length))
    .replace('{openJobs}', String(openJobs))
    .replace('{revenue}', revenue.toFixed(0))
    .replace('{profit}', profit.toFixed(0))
    .replace('{outstanding}', outstanding.toFixed(0))
}
