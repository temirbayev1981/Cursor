let chartBundlesPrefetched = false

/** Warm recharts and chart-heavy routes after staff app shell loads. */
export function prefetchChartBundles(): void {
  if (chartBundlesPrefetched || typeof window === 'undefined') return
  chartBundlesPrefetched = true
  void import('recharts')
  void import('@/pages/dashboard')
  void import('@/pages/reports')
}
