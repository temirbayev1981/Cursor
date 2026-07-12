const prefetched = new Set<'dashboard' | 'reports'>()

/** Warm recharts chunks only on chart-heavy routes. */
export function prefetchChartBundles(pathname: string): void {
  if (typeof window === 'undefined') return

  if ((pathname === '/dashboard' || pathname === '/') && !prefetched.has('dashboard')) {
    prefetched.add('dashboard')
    void import('@/components/charts/dashboard-charts')
  }

  if (pathname.startsWith('/reports') && !prefetched.has('reports')) {
    prefetched.add('reports')
    void import('@/components/charts/reports-recharts')
  }
}
