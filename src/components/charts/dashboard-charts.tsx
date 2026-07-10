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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartEmpty } from '@/components/shared/chart-empty'
import { ChartTooltip, CHART_PIE_COLORS } from '@/components/charts/chart-tooltip'
import {
  hasRevenueData,
  hasValueData,
  hasProfitData,
  hasTechnicianData,
  type ChartDataPoint,
} from '@/lib/analytics'

export interface DashboardChartsLabels {
  revenueProfitTrends: string
  expenseBreakdown: string
  profitableServices: string
  technicianPerformance: string
  revenue: string
  profit: string
  noData: string
}

export interface DashboardChartsProps {
  revenueChart: ChartDataPoint[]
  expenseChart: ChartDataPoint[]
  serviceChart: ChartDataPoint[]
  techChart: ChartDataPoint[]
  labels: DashboardChartsLabels
}

export function DashboardCharts({
  revenueChart,
  expenseChart,
  serviceChart,
  techChart,
  labels,
}: DashboardChartsProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="dashboard-charts">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><CardTitle>{labels.revenueProfitTrends}</CardTitle></CardHeader>
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
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name={labels.revenue} stroke="#0ea5e9" fill="url(#revenueGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name={labels.profit} stroke="#22c55e" fill="url(#profitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={labels.noData} height={240} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader><CardTitle>{labels.expenseBreakdown}</CardTitle></CardHeader>
            <CardContent>
              {hasValueData(expenseChart) ? (
              <div className="h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name">
                    {expenseChart.map((_, index) => (
                      <Cell key={index} fill={CHART_PIE_COLORS[index % CHART_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={labels.noData} height={240} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader><CardTitle>{labels.profitableServices}</CardTitle></CardHeader>
            <CardContent>
              {hasProfitData(serviceChart) ? (
              <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={72} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="profit" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={labels.noData} height={220} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader><CardTitle>{labels.technicianPerformance}</CardTitle></CardHeader>
            <CardContent>
              {hasTechnicianData(techChart) ? (
              <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name={labels.revenue} fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty message={labels.noData} height={220} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
