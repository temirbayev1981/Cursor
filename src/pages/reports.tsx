import { Download, FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  computeRevenueChart,
  computeServiceProfitability,
  computeTechnicianPerformance,
} from '@/lib/analytics'
import {
  REVENUE_CHART_DATA,
  SERVICE_PROFITABILITY,
  TECHNICIAN_PERFORMANCE,
} from '@/data/mock-data'
import { useJobs, useCustomers, useEmployees } from '@/hooks/use-entities'
import { TableSkeleton } from '@/components/shared/skeleton'
import { formatCurrency } from '@/lib/utils'
import { ProfitIndicator } from '@/components/shared/status-badge'
import { exportFinancialReport, exportReportPdfPlaceholder } from '@/lib/export'
import { useTranslation } from '@/contexts/locale-context'

export default function ReportsPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: customers = [], isLoading: custLoading } = useCustomers()
  const { data: employees = [] } = useEmployees()

  const revenueChart = computeRevenueChart(jobs)
  const serviceChart = computeServiceProfitability(jobs)
  const techChart = computeTechnicianPerformance(jobs, employees)

  if (jobsLoading || custLoading) return <TableSkeleton rows={6} cols={4} />

  return (
    <div>
      <PageHeader
        title={t.reports.title}
        description={t.reports.description}
        actions={
          <>
            <Button variant="outline" onClick={() => exportReportPdfPlaceholder(t.reports.title)}>
              <Download className="h-4 w-4" />{t.common.exportPdf}
            </Button>
            <Button variant="outline" onClick={() => exportFinancialReport(jobs, customers)}>
              <FileSpreadsheet className="h-4 w-4" />{t.common.exportCsv}
            </Button>
          </>
        }
      />

      <Tabs defaultValue="financial">
        <TabsList className="mb-6">
          <TabsTrigger value="financial">{t.reports.financial}</TabsTrigger>
          <TabsTrigger value="profit">{t.reports.profit}</TabsTrigger>
          <TabsTrigger value="technicians">{t.reports.technicians}</TabsTrigger>
          <TabsTrigger value="customers">{t.reports.customers}</TabsTrigger>
          <TabsTrigger value="services">{t.reports.services}</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <Card>
            <CardHeader><CardTitle>{t.reports.revenueReport}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueChart.length > 1 ? revenueChart : REVENUE_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <div className="space-y-3">
            {jobs.filter((j) => j.status === 'completed').map((job) => {
              const customer = customers.find((c) => c.id === job.customer_id)
              const totalCost = job.labor_cost + job.material_cost + job.fuel_cost + job.overhead_cost
              return (
                <Card key={job.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{customer?.name}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">{t.dashboard.revenue}</p>
                        <p className="font-semibold text-success">{formatCurrency(job.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">{t.reports.costs}</p>
                        <p className="font-semibold text-destructive">{formatCurrency(totalCost)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">{t.reports.netProfit}</p>
                        <p className="font-semibold">{formatCurrency(job.profit)}</p>
                      </div>
                      <ProfitIndicator margin={job.profit_margin} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="technicians">
          <Card>
            <CardHeader><CardTitle>{t.reports.techPerformance}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={techChart.length > 0 ? techChart : TECHNICIAN_PERFORMANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#fbbf24" name={t.dashboard.revenue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="jobs" fill="#0ea5e9" name={t.nav.jobs} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-3">
            {customers.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.job_count} {t.reports.jobsCount}</p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(c.total_revenue)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader><CardTitle>{t.reports.serviceProfit}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={serviceChart.length > 0 ? serviceChart : SERVICE_PROFITABILITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
