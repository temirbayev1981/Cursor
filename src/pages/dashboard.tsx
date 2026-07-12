import {
  DollarSign,
  Briefcase,
  CheckCircle,
  FileText,
  Users,
  Package,
  Fuel,
  TrendingUp,
} from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobStatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import {
  computeDashboardMetrics,
  computeRevenueChart,
  computeExpenseBreakdown,
  localizeExpenseChart,
  computeServiceProfitability,
  computeTechnicianPerformance,
  computePeriodComparison,
} from '@/lib/analytics'
import { LazyDashboardCharts } from '@/components/charts/lazy-dashboard-charts'
import { useJobs, useCustomerContacts, useEstimatesPendingSummary, useExpenses, useEmployees, useFuelLogs } from '@/hooks/use-entities'
import { Skeleton } from '@/components/shared/skeleton'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { AppVersionBadge } from '@/components/shared/app-version-badge'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: customers = [], isLoading: customersLoading } = useCustomerContacts()
  const { data: pendingSummary } = useEstimatesPendingSummary()
  const { data: expenses = [] } = useExpenses()
  const { data: employees = [] } = useEmployees()
  const { data: fuelLogs = [] } = useFuelLogs()

  const metrics = computeDashboardMetrics(jobs, expenses, fuelLogs, pendingSummary?.pendingCount ?? 0)
  const comparison = computePeriodComparison(jobs)
  const revenueChart = computeRevenueChart(jobs)
  const expenseChart = localizeExpenseChart(
    computeExpenseBreakdown(jobs, expenses, fuelLogs),
    {
      Labor: t.dashboard.labor,
      Materials: t.dashboard.materials,
      Fuel: t.dashboard.fuel,
      Tools: t.dashboard.tools,
      Insurance: t.dashboard.insurance,
      Office: t.expenses.categories.office,
      Other: t.expenses.categories.other,
    },
  )
  const serviceChart = computeServiceProfitability(jobs)
  const techChart = computeTechnicianPerformance(jobs, employees)

  const recentJobs = jobs.slice(0, 4)
  const recentJobsLoading = jobsLoading || customersLoading

  return (
    <div>
      <PageHeader
        title={t.dashboard.title}
        description={t.dashboard.description}
        actions={<AppVersionBadge />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="dashboard-stat-cards">
        <StatCard title={t.dashboard.revenueToday} value={metrics.revenueToday} icon={DollarSign} format="currency" trend={comparison.revenueTrend} delay={0} />
        <StatCard title={t.dashboard.revenueMonth} value={metrics.revenueMonth} icon={TrendingUp} format="currency" trend={comparison.revenueTrend} delay={0.05} />
        <StatCard title={t.dashboard.openJobs} value={metrics.openJobs} icon={Briefcase} subtitle={`${metrics.completedJobs} ${t.common.completedThisMonth}`} trend={comparison.jobsTrend} delay={0.1} />
        <StatCard title={t.dashboard.pendingEstimates} value={metrics.pendingEstimates} icon={FileText} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title={t.dashboard.laborCost} value={metrics.laborCost} icon={Users} format="currency" delay={0.2} />
        <StatCard title={t.dashboard.materialCost} value={metrics.materialCost} icon={Package} format="currency" delay={0.25} />
        <StatCard title={t.dashboard.fuelExpenses} value={metrics.fuelExpenses} icon={Fuel} format="currency" delay={0.3} />
        <StatCard title={t.dashboard.profitMargin} value={metrics.profitMargin} icon={CheckCircle} format="percent" trend={comparison.profitTrend} delay={0.35} />
      </div>

      <LazyDashboardCharts
        revenueChart={revenueChart}
        expenseChart={expenseChart}
        serviceChart={serviceChart}
        techChart={techChart}
        labels={{
          revenueProfitTrends: t.dashboard.revenueProfitTrends,
          expenseBreakdown: t.dashboard.expenseBreakdown,
          profitableServices: t.dashboard.profitableServices,
          technicianPerformance: t.dashboard.technicianPerformance,
          revenue: t.dashboard.revenue,
          profit: t.dashboard.profit,
          noData: t.common.noData,
        }}
      />

      <Card data-testid="dashboard-recent-jobs">
        <CardHeader><CardTitle>{t.dashboard.recentJobs}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (
              recentJobs.map((job) => {
                const customer = customers.find((c) => c.id === job.customer_id)
                return (
                  <div key={job.id} className="flex flex-col gap-3 rounded-lg bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{customer?.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <PriorityBadge priority={job.priority} />
                      <JobStatusBadge status={job.status} />
                      <span className="text-sm font-semibold">{formatCurrency(job.revenue)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
