import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
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
  computeServiceProfitability,
  computeTechnicianPerformance,
  computePeriodComparison,
  hasRevenueData,
  hasValueData,
  hasProfitData,
  hasTechnicianData,
} from '@/lib/analytics'
import { ChartEmpty } from '@/components/shared/chart-empty'
import { useJobs, useCustomers, useEstimates, useExpenses, useEmployees, useFuelLogs } from '@/hooks/use-entities'
import { Skeleton } from '@/components/shared/skeleton'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

const PIE_COLORS = ['#0ea5e9', '#fbbf24', '#22c55e', '#ef4444', '#8b5cf6', '#f97316']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('profit') || entry.name === 'value'
            ? formatCurrency(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const { data: estimates = [] } = useEstimates()
  const { data: expenses = [] } = useExpenses()
  const { data: employees = [] } = useEmployees()
  const { data: fuelLogs = [] } = useFuelLogs()

  const metrics = computeDashboardMetrics(jobs, estimates, expenses, fuelLogs)
  const comparison = computePeriodComparison(jobs)
  const revenueChart = computeRevenueChart(jobs)
  const expenseChart = computeExpenseBreakdown(jobs, expenses, fuelLogs)
  const serviceChart = computeServiceProfitability(jobs)
  const techChart = computeTechnicianPerformance(jobs, employees)

  const recentJobs = jobs.slice(0, 4)
  const recentJobsLoading = jobsLoading || customersLoading

  return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="dashboard-charts">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><CardTitle>{t.dashboard.revenueProfitTrends}</CardTitle></CardHeader>
            <CardContent>
              {hasRevenueData(revenueChart) ? (
              <div className="h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name={t.dashboard.revenue} stroke="#0ea5e9" fill="url(#revenueGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name={t.dashboard.profit} stroke="#22c55e" fill="url(#profitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={t.common.noData} height={240} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader><CardTitle>{t.dashboard.expenseBreakdown}</CardTitle></CardHeader>
            <CardContent>
              {hasValueData(expenseChart) ? (
              <div className="h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name">
                    {expenseChart.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={t.common.noData} height={240} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader><CardTitle>{t.dashboard.profitableServices}</CardTitle></CardHeader>
            <CardContent>
              {hasProfitData(serviceChart) ? (
              <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={72} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={t.common.noData} height={220} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader><CardTitle>{t.dashboard.technicianPerformance}</CardTitle></CardHeader>
            <CardContent>
              {hasTechnicianData(techChart) ? (
              <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name={t.dashboard.revenue} fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={t.common.noData} height={220} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
