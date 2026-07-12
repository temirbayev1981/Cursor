import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  computeRevenueChart,
  computeServiceProfitability,
  computeTechnicianPerformance,
  computeReportSummary,
  computeExpenseBreakdown,
  localizeExpenseChart,
  computeRangeComparison,
  filterJobsByDateRange,
  filterExpensesByDateRange,
  filterFuelLogsByDateRange,
} from '@/lib/analytics'
import {
  LazyReportsExpensesChart,
  LazyReportsFinancialChart,
  LazyReportsServicesChart,
  LazyReportsTechniciansChart,
} from '@/components/charts/lazy-reports-charts'
import { useJobs, useCustomers, useEmployees, useExpenses, useFuelLogs } from '@/hooks/use-entities'
import { TableSkeleton } from '@/components/shared/skeleton'
import { formatCurrency } from '@/lib/utils'
import { ProfitIndicator } from '@/components/shared/status-badge'
import { useTranslation } from '@/contexts/locale-context'
import { subMonths, format } from 'date-fns'

type ReportTab = 'financial' | 'profit' | 'technicians' | 'customers' | 'services' | 'expenses'

function defaultStartDate() {
  return format(subMonths(new Date(), 6), 'yyyy-MM-dd')
}

function defaultEndDate() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ReportTab>('financial')
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: customers = [], isLoading: custLoading } = useCustomers()
  const { data: employees = [] } = useEmployees()
  const { data: expenses = [] } = useExpenses()
  const { data: fuelLogs = [] } = useFuelLogs()

  const filteredJobs = useMemo(
    () => filterJobsByDateRange(jobs, startDate, endDate),
    [jobs, startDate, endDate],
  )

  const filteredExpenses = useMemo(
    () => filterExpensesByDateRange(expenses, startDate, endDate),
    [expenses, startDate, endDate],
  )

  const filteredFuelLogs = useMemo(
    () => filterFuelLogsByDateRange(fuelLogs, startDate, endDate),
    [fuelLogs, startDate, endDate],
  )

  const summary = useMemo(() => computeReportSummary(filteredJobs), [filteredJobs])
  const comparison = useMemo(
    () => computeRangeComparison(jobs, startDate, endDate),
    [jobs, startDate, endDate],
  )
  const revenueChart = useMemo(() => computeRevenueChart(filteredJobs), [filteredJobs])
  const serviceChart = useMemo(() => computeServiceProfitability(filteredJobs), [filteredJobs])
  const techChart = useMemo(() => computeTechnicianPerformance(filteredJobs, employees), [filteredJobs, employees])
  const expenseChart = useMemo(
    () => computeExpenseBreakdown(filteredJobs, filteredExpenses, filteredFuelLogs),
    [filteredJobs, filteredExpenses, filteredFuelLogs],
  )

  const expenseCategoryLabels = useMemo(
    () => ({
      Labor: t.dashboard.labor,
      Materials: t.dashboard.materials,
      Fuel: t.dashboard.fuel,
      Tools: t.dashboard.tools,
      Insurance: t.dashboard.insurance,
      Office: t.expenses.categories.office,
      Other: t.expenses.categories.other,
    }),
    [t],
  )

  const localizedExpenseChart = useMemo(
    () => localizeExpenseChart(expenseChart, expenseCategoryLabels),
    [expenseChart, expenseCategoryLabels],
  )

  const dateRangeLabel = `${startDate} — ${endDate}`

  const tabLabels: Record<ReportTab, string> = {
    financial: t.reports.financial,
    profit: t.reports.profit,
    technicians: t.reports.technicians,
    customers: t.reports.customers,
    services: t.reports.services,
    expenses: t.reports.expenses,
  }

  const handleExportPdf = async () => {
    const pdfLabels = {
      jobs: t.nav.jobs,
      revenue: t.dashboard.revenue,
      profit: t.reports.netProfit,
      margin: t.reports.margin,
      revenueByMonth: t.reports.pdf.revenueByMonth,
      month: t.reports.pdf.month,
      technicianPerformance: t.reports.techPerformance,
      name: t.reports.pdf.name,
      efficiency: t.reports.efficiency,
      serviceProfitability: t.reports.serviceProfit,
      service: t.reports.pdf.service,
      customers: t.reports.customers,
      customer: t.customers.customer,
      jobProfitability: t.reports.profit,
      job: t.jobs.job,
      costs: t.reports.costs,
      expenseBreakdown: t.reports.expenseBreakdown,
      category: t.expenses.category,
      amount: t.expenses.amount,
    }
    const { exportReportPdf } = await import('@/lib/export')
    exportReportPdf({
      title: t.reports.title,
      dateRangeLabel,
      activeTab: tabLabels[activeTab],
      summary,
      labels: pdfLabels,
      revenueChart: activeTab === 'financial' ? revenueChart : undefined,
      technicians: activeTab === 'technicians' ? techChart : undefined,
      services: activeTab === 'services' ? serviceChart : undefined,
      customers: activeTab === 'customers' ? customers : undefined,
      profitJobs: activeTab === 'profit'
        ? filteredJobs
            .filter((job) => job.status === 'completed')
            .map((job) => {
              const customer = customers.find((c) => c.id === job.customer_id)
              const costs = job.labor_cost + job.material_cost + job.fuel_cost + job.overhead_cost
              return {
                title: job.title,
                customer: customer?.name ?? '',
                revenue: job.revenue,
                costs,
                profit: job.profit,
                margin: job.profit_margin,
              }
            })
        : undefined,
      expenses: activeTab === 'expenses' ? localizedExpenseChart : undefined,
    })
  }

  const reportChartLabels = {
    revenueReport: t.reports.revenueReport,
    techPerformance: t.reports.techPerformance,
    serviceProfit: t.reports.serviceProfit,
    expenseBreakdown: t.reports.expenseBreakdown,
    revenue: t.dashboard.revenue,
    jobs: t.nav.jobs,
    efficiency: t.reports.efficiency,
    noData: t.common.noData,
  }

  if (jobsLoading || custLoading) return <TableSkeleton rows={6} cols={4} />

  return (
    <div>
      <PageHeader
        title={t.reports.title}
        description={t.reports.description}
        actions={
          <>
            <Button variant="outline" data-testid="reports-export-pdf" onClick={handleExportPdf}>
              <Download className="h-4 w-4" />{t.common.exportPdf}
            </Button>
            <Button variant="outline" data-testid="reports-export-csv" onClick={() => void (async () => {
              const { exportFullReport } = await import('@/lib/export')
              await exportFullReport(filteredJobs, customers, employees)
            })()}>
              <FileSpreadsheet className="h-4 w-4" />{t.common.exportCsv}
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-start">{t.reports.dateFrom}</Label>
              <Input
                id="report-start"
                type="date"
                className="mt-1"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="report-end">{t.reports.dateTo}</Label>
              <Input
                id="report-end"
                type="date"
                className="mt-1"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t.dashboard.revenue}</p>
              <p className="font-semibold">{formatCurrency(summary.revenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.reports.netProfit}</p>
              <p className="font-semibold">{formatCurrency(summary.profit)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.nav.jobs}</p>
              <p className="font-semibold">{summary.jobs}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.reports.margin}</p>
              <p className="font-semibold">{summary.margin}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.reports.vsPrevious}</p>
              <p className={`font-semibold ${comparison.revenueTrend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {comparison.revenueTrend >= 0 ? '+' : ''}{comparison.revenueTrend}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="financial" data-testid="reports-tab-financial">{t.reports.financial}</TabsTrigger>
          <TabsTrigger value="profit" data-testid="reports-tab-profit">{t.reports.profit}</TabsTrigger>
          <TabsTrigger value="technicians" data-testid="reports-tab-technicians">{t.reports.technicians}</TabsTrigger>
          <TabsTrigger value="customers" data-testid="reports-tab-customers">{t.reports.customers}</TabsTrigger>
          <TabsTrigger value="services" data-testid="reports-tab-services">{t.reports.services}</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="reports-tab-expenses">{t.reports.expenses}</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <LazyReportsFinancialChart revenueChart={revenueChart} labels={reportChartLabels} />
        </TabsContent>

        <TabsContent value="profit">
          <div className="space-y-3">
            {filteredJobs.filter((j) => j.status === 'completed').map((job) => {
              const customer = customers.find((c) => c.id === job.customer_id)
              const totalCost = job.labor_cost + job.material_cost + job.fuel_cost + job.overhead_cost
              return (
                <Card key={job.id} data-testid={`report-profit-card-${job.id}`}>
                  <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{customer?.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm sm:flex sm:items-center sm:gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-muted-foreground">{t.dashboard.revenue}</p>
                        <p className="font-semibold text-success">{formatCurrency(job.revenue)}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-muted-foreground">{t.reports.costs}</p>
                        <p className="font-semibold text-destructive">{formatCurrency(totalCost)}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-muted-foreground">{t.reports.netProfit}</p>
                        <p className="font-semibold">{formatCurrency(job.profit)}</p>
                      </div>
                      <div className="flex items-center sm:justify-end">
                        <ProfitIndicator margin={job.profit_margin} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="technicians">
          <LazyReportsTechniciansChart techChart={techChart} labels={reportChartLabels} />
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-3">
            {customers.map((c) => (
              <Card key={c.id} data-testid={`report-customer-card-${c.id}`}>
                <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.job_count} {t.reports.jobsCount}</p>
                  </div>
                  <p className="text-lg font-bold sm:text-right">{formatCurrency(c.total_revenue)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services">
          <LazyReportsServicesChart serviceChart={serviceChart} labels={reportChartLabels} />
        </TabsContent>

        <TabsContent value="expenses">
          <LazyReportsExpensesChart expenseChart={localizedExpenseChart} labels={reportChartLabels} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
