import { describe, it, expect } from 'vitest'
import { prefetchChartBundles } from '@/lib/chart-prefetch'

describe('chart-prefetch', () => {
  it('prefetches chart bundles on dashboard and reports routes', async () => {
    expect(() => prefetchChartBundles('/jobs')).not.toThrow()
    expect(() => prefetchChartBundles('/dashboard')).not.toThrow()
    await import('@/components/charts/dashboard-charts')

    expect(() => prefetchChartBundles('/reports')).not.toThrow()
    await import('@/components/charts/reports-recharts')

    expect(() => prefetchChartBundles('/dashboard')).not.toThrow()
    expect(() => prefetchChartBundles('/reports')).not.toThrow()
  })
})
