import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartEmpty } from '@/components/shared/chart-empty'
import { CHART_PIE_COLORS } from '@/components/charts/chart-tooltip'
import {
  hasRevenueData,
  hasProfitData,
  hasTechnicianData,
  hasValueData,
  type ChartDataPoint,
} from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'

export interface ReportsRechartsLabels {
  revenueReport: string
  techPerformance: string
  serviceProfit: string
  expenseBreakdown: string
  revenue: string
  jobs: string
  efficiency: string
  noData: string
}

export interface ReportsRechartsProps {
  revenueChart: ChartDataPoint[]
  techChart: ChartDataPoint[]
  serviceChart: ChartDataPoint[]
  expenseChart: ChartDataPoint[]
  labels: ReportsRechartsLabels
}

export type ReportsFinancialChartProps = Pick<ReportsRechartsProps, 'revenueChart' | 'labels'>
export type ReportsTechniciansChartProps = Pick<ReportsRechartsProps, 'techChart' | 'labels'>
export type ReportsServicesChartProps = Pick<ReportsRechartsProps, 'serviceChart' | 'labels'>
export type ReportsExpensesChartProps = Pick<ReportsRechartsProps, 'expenseChart' | 'labels'>

export function ReportsFinancialChart({ revenueChart, labels }: ReportsFinancialChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{labels.revenueReport}</CardTitle></CardHeader>
      <CardContent>
        {hasRevenueData(revenueChart) ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={labels.noData} height={350} />
        )}
      </CardContent>
    </Card>
  )
}

export function ReportsTechniciansChart({ techChart, labels }: ReportsTechniciansChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{labels.techPerformance}</CardTitle></CardHeader>
      <CardContent>
        {hasTechnicianData(techChart) ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={techChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="revenue" fill="#fbbf24" name={labels.revenue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="jobs" fill="#0ea5e9" name={labels.jobs} radius={[4, 4, 0, 0]} />
              <Bar dataKey="efficiency" fill="#22c55e" name={labels.efficiency} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={labels.noData} height={350} />
        )}
      </CardContent>
    </Card>
  )
}

export function ReportsServicesChart({ serviceChart, labels }: ReportsServicesChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{labels.serviceProfit}</CardTitle></CardHeader>
      <CardContent>
        {hasProfitData(serviceChart) ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serviceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={labels.noData} height={350} />
        )}
      </CardContent>
    </Card>
  )
}

export function ReportsExpensesChart({ expenseChart, labels }: ReportsExpensesChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{labels.expenseBreakdown}</CardTitle></CardHeader>
      <CardContent>
        {hasValueData(expenseChart) ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={expenseChart}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {expenseChart.map((_, index) => (
                  <Cell key={index} fill={CHART_PIE_COLORS[index % CHART_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={labels.noData} height={350} />
        )}
      </CardContent>
    </Card>
  )
}
