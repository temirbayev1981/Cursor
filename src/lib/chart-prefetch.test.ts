import { describe, it, expect } from 'vitest'
import { prefetchChartBundles } from '@/lib/chart-prefetch'

describe('chart-prefetch', () => {
  it('prefetches chart bundles without throwing', () => {
    expect(() => prefetchChartBundles()).not.toThrow()
    expect(() => prefetchChartBundles()).not.toThrow()
  })
})
