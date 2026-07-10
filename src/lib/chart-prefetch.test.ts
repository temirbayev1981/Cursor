import { describe, it, expect } from 'vitest'
import { prefetchChartBundles } from '@/lib/chart-prefetch'

describe('chart-prefetch', () => {
  it('prefetches chart bundles without throwing', async () => {
    expect(() => prefetchChartBundles()).not.toThrow()
    await Promise.all([
      import('@/components/charts/dashboard-charts'),
      import('@/components/charts/reports-recharts'),
    ])
    expect(() => prefetchChartBundles()).not.toThrow()
  })
})
