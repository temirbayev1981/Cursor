import { lazy, Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/shared/skeleton'
import type {
  ReportsExpensesChartProps,
  ReportsFinancialChartProps,
  ReportsServicesChartProps,
  ReportsTechniciansChartProps,
} from '@/components/charts/reports-recharts'

const ReportsFinancialChart = lazy(() =>
  import('@/components/charts/reports-recharts').then((mod) => ({ default: mod.ReportsFinancialChart })),
)
const ReportsTechniciansChart = lazy(() =>
  import('@/components/charts/reports-recharts').then((mod) => ({ default: mod.ReportsTechniciansChart })),
)
const ReportsServicesChart = lazy(() =>
  import('@/components/charts/reports-recharts').then((mod) => ({ default: mod.ReportsServicesChart })),
)
const ReportsExpensesChart = lazy(() =>
  import('@/components/charts/reports-recharts').then((mod) => ({ default: mod.ReportsExpensesChart })),
)

function ChartSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
      {children}
    </Suspense>
  )
}

export function LazyReportsFinancialChart(props: ReportsFinancialChartProps) {
  return (
    <ChartSuspense>
      <ReportsFinancialChart {...props} />
    </ChartSuspense>
  )
}

export function LazyReportsTechniciansChart(props: ReportsTechniciansChartProps) {
  return (
    <ChartSuspense>
      <ReportsTechniciansChart {...props} />
    </ChartSuspense>
  )
}

export function LazyReportsServicesChart(props: ReportsServicesChartProps) {
  return (
    <ChartSuspense>
      <ReportsServicesChart {...props} />
    </ChartSuspense>
  )
}

export function LazyReportsExpensesChart(props: ReportsExpensesChartProps) {
  return (
    <ChartSuspense>
      <ReportsExpensesChart {...props} />
    </ChartSuspense>
  )
}
