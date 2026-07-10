import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/shared/skeleton'
import type { DashboardChartsProps } from '@/components/charts/dashboard-charts'

const DashboardCharts = lazy(() =>
  import('@/components/charts/dashboard-charts').then((mod) => ({ default: mod.DashboardCharts })),
)

export function LazyDashboardCharts(props: DashboardChartsProps) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] w-full mb-8" data-testid="dashboard-charts-loading" />}>
      <DashboardCharts {...props} />
    </Suspense>
  )
}
