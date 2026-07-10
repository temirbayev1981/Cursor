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
  DEMO_DASHBOARD,
  REVENUE_CHART_DATA,
  EXPENSE_BREAKDOWN,
  SERVICE_PROFITABILITY,
  TECHNICIAN_PERFORMANCE,
  DEMO_JOBS,
  DEMO_CUSTOMERS,
} from '@/data/mock-data'
import { formatCurrency } from '@/lib/utils'

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
  const metrics = DEMO_DASHBOARD
  const recentJobs = DEMO_JOBS.slice(0, 4)

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Real-time business performance overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Revenue Today" value={metrics.revenueToday} icon={DollarSign} format="currency" trend={12.5} delay={0} />
        <StatCard title="Revenue This Month" value={metrics.revenueMonth} icon={TrendingUp} format="currency" trend={4.0} delay={0.05} />
        <StatCard title="Open Jobs" value={metrics.openJobs} icon={Briefcase} subtitle={`${metrics.completedJobs} completed this month`} delay={0.1} />
        <StatCard title="Pending Estimates" value={metrics.pendingEstimates} icon={FileText} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Labor Cost" value={metrics.laborCost} icon={Users} format="currency" delay={0.2} />
        <StatCard title="Material Cost" value={metrics.materialCost} icon={Package} format="currency" delay={0.25} />
        <StatCard title="Fuel Expenses" value={metrics.fuelExpenses} icon={Fuel} format="currency" delay={0.3} />
        <StatCard title="Profit Margin" value={metrics.profitMargin} icon={CheckCircle} format="percent" delay={0.35} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={REVENUE_CHART_DATA}>
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
                  <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#revenueGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#profitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={EXPENSE_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {EXPENSE_BREAKDOWN.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Most Profitable Services</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SERVICE_PROFITABILITY} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={TECHNICIAN_PERFORMANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.map((job) => {
              const customer = DEMO_CUSTOMERS.find((c) => c.id === job.customer_id)
              return (
                <div key={job.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{customer?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={job.priority} />
                    <JobStatusBadge status={job.status} />
                    <span className="text-sm font-semibold">{formatCurrency(job.revenue)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
