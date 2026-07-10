import type { Job, Estimate, Expense, Employee, FuelLog, DashboardMetrics } from '@/types'

export interface ChartDataPoint {
  name: string
  revenue?: number
  profit?: number
  value?: number
  jobs?: number
  efficiency?: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getJobReportDate(job: Job): string {
  return job.completed_date ?? job.scheduled_date ?? job.created_at
}

export function filterJobsByDateRange(jobs: Job[], startDate?: string, endDate?: string): Job[] {
  if (!startDate && !endDate) return jobs

  const start = startDate ? new Date(`${startDate}T00:00:00`) : null
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null

  return jobs.filter((job) => {
    const date = new Date(getJobReportDate(job))
    if (start && date < start) return false
    if (end && date > end) return false
    return true
  })
}

export function computeReportSummary(jobs: Job[]) {
  const revenue = jobs.reduce((sum, job) => sum + job.revenue, 0)
  const profit = jobs.reduce((sum, job) => sum + job.profit, 0)
  return {
    jobs: jobs.length,
    revenue,
    profit,
    margin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
  }
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export interface PeriodComparison {
  current: { revenue: number; profit: number; jobs: number }
  previous: { revenue: number; profit: number; jobs: number }
  revenueTrend: number
  profitTrend: number
  jobsTrend: number
}

export function computePeriodComparison(jobs: Job[], referenceDate = new Date()): PeriodComparison {
  const currentMonth = referenceDate.getMonth()
  const currentYear = referenceDate.getFullYear()
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const inMonth = (job: Job, month: number, year: number) => {
    const date = new Date(getJobReportDate(job))
    return date.getMonth() === month && date.getFullYear() === year
  }

  const summarize = (list: Job[]) => ({
    revenue: list.reduce((sum, job) => sum + job.revenue, 0),
    profit: list.reduce((sum, job) => sum + job.profit, 0),
    jobs: list.length,
  })

  const current = summarize(jobs.filter((job) => inMonth(job, currentMonth, currentYear)))
  const previous = summarize(jobs.filter((job) => inMonth(job, previousMonth, previousYear)))

  return {
    current,
    previous,
    revenueTrend: percentChange(current.revenue, previous.revenue),
    profitTrend: percentChange(current.profit, previous.profit),
    jobsTrend: percentChange(current.jobs, previous.jobs),
  }
}

export function computeRangeComparison(jobs: Job[], startDate: string, endDate: string): PeriodComparison {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)
  const durationMs = end.getTime() - start.getTime()
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - durationMs)

  const inRange = (job: Job, from: Date, to: Date) => {
    const date = new Date(getJobReportDate(job))
    return date >= from && date <= to
  }

  const summarize = (list: Job[]) => ({
    revenue: list.reduce((sum, job) => sum + job.revenue, 0),
    profit: list.reduce((sum, job) => sum + job.profit, 0),
    jobs: list.length,
  })

  const current = summarize(jobs.filter((job) => inRange(job, start, end)))
  const previous = summarize(jobs.filter((job) => inRange(job, previousStart, previousEnd)))

  return {
    current,
    previous,
    revenueTrend: percentChange(current.revenue, previous.revenue),
    profitTrend: percentChange(current.profit, previous.profit),
    jobsTrend: percentChange(current.jobs, previous.jobs),
  }
}

export function filterExpensesByDateRange(expenses: Expense[], startDate?: string, endDate?: string): Expense[] {
  if (!startDate && !endDate) return expenses

  const start = startDate ? new Date(`${startDate}T00:00:00`) : null
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null

  return expenses.filter((expense) => {
    const date = new Date(expense.date)
    if (start && date < start) return false
    if (end && date > end) return false
    return true
  })
}

export function filterFuelLogsByDateRange(fuelLogs: FuelLog[], startDate?: string, endDate?: string): FuelLog[] {
  if (!startDate && !endDate) return fuelLogs

  const start = startDate ? new Date(`${startDate}T00:00:00`) : null
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null

  return fuelLogs.filter((log) => {
    const date = new Date(log.date)
    if (start && date < start) return false
    if (end && date > end) return false
    return true
  })
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export function computeDashboardMetrics(
  jobs: Job[],
  estimates: Estimate[],
  expenses: Expense[],
  fuelLogs: FuelLog[]
): DashboardMetrics {
  void expenses
  const monthJobs = jobs.filter((j) => isThisMonth(j.created_at))
  const completedMonth = monthJobs.filter((j) => j.status === 'completed')
  const openJobs = jobs.filter((j) => ['draft', 'scheduled', 'in_progress'].includes(j.status)).length
  const revenueMonth = monthJobs.reduce((s, j) => s + j.revenue, 0)
  const revenueToday = jobs.filter((j) => j.completed_date && isToday(j.completed_date)).reduce((s, j) => s + j.revenue, 0)
  const laborCost = monthJobs.reduce((s, j) => s + j.labor_cost, 0)
  const materialCost = monthJobs.reduce((s, j) => s + j.material_cost, 0)
  const fuelExpenses = fuelLogs.filter((f) => isThisMonth(f.date)).reduce((s, f) => s + f.total_cost, 0)
    + monthJobs.reduce((s, j) => s + j.fuel_cost, 0)
  const totalProfit = monthJobs.reduce((s, j) => s + j.profit, 0)
  const profitMargin = revenueMonth > 0 ? (totalProfit / revenueMonth) * 100 : 0

  return {
    revenueToday: revenueToday || completedMonth.slice(0, 1).reduce((s, j) => s + j.revenue, 0),
    revenueMonth,
    openJobs,
    completedJobs: completedMonth.length,
    pendingEstimates: estimates.filter((e) => ['draft', 'sent'].includes(e.status)).length,
    laborCost,
    materialCost,
    fuelExpenses,
    profitMargin: Math.round(profitMargin * 10) / 10,
  }
}

export function computeRevenueChart(jobs: Job[]): ChartDataPoint[] {
  const byMonth = new Map<string, { revenue: number; profit: number; sortKey: string }>()
  for (const job of jobs) {
    const d = new Date(getJobReportDate(job))
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    const cur = byMonth.get(key) ?? { revenue: 0, profit: 0, sortKey }
    cur.revenue += job.revenue
    cur.profit += job.profit
    byMonth.set(key, cur)
  }
  if (byMonth.size === 0) {
    return MONTH_NAMES.slice(0, 7).map((name) => ({ name, revenue: 0, profit: 0 }))
  }
  return Array.from(byMonth.entries())
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .map(([name, value]) => ({ name, revenue: value.revenue, profit: value.profit }))
}

export function computeExpenseBreakdown(jobs: Job[], expenses: Expense[], fuelLogs: FuelLog[]): ChartDataPoint[] {
  const labor = jobs.reduce((s, j) => s + j.labor_cost, 0)
  const materials = jobs.reduce((s, j) => s + j.material_cost, 0)
  const fuel = jobs.reduce((s, j) => s + j.fuel_cost, 0) + fuelLogs.reduce((s, f) => s + f.total_cost, 0)
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const points: ChartDataPoint[] = [
    { name: 'Labor', value: labor },
    { name: 'Materials', value: materials },
    { name: 'Fuel', value: fuel },
  ]
  for (const [name, value] of Object.entries(byCategory)) {
    if (!['Labor', 'Materials', 'Fuel'].includes(name)) {
      points.push({ name, value })
    }
  }
  return points.filter((p) => (p.value ?? 0) > 0)
}

export function computeServiceProfitability(jobs: Job[]): ChartDataPoint[] {
  const keywords: [string, RegExp][] = [
    ['Electrical', /electr|outlet|panel/i],
    ['Plumbing', /plumb|faucet|pipe|leak/i],
    ['Drywall', /drywall|patch/i],
    ['Painting', /paint/i],
    ['Maintenance', /maint|turnover|HVAC/i],
    ['Carpentry', /door|trim|cabinet|wood/i],
  ]
  return keywords.map(([name, re]) => {
    const matched = jobs.filter((j) => re.test(j.title))
    return {
      name,
      profit: matched.reduce((s, j) => s + j.profit, 0),
      jobs: matched.length,
    }
  }).filter((p) => (p.jobs ?? 0) > 0)
}

export function computeTechnicianPerformance(jobs: Job[], employees: Employee[]): ChartDataPoint[] {
  return employees
    .filter((e) => e.billing_rate > 0)
    .map((emp) => {
      const empJobs = jobs.filter((j) => j.assigned_technician_id === emp.id)
      const revenue = empJobs.reduce((s, j) => s + j.revenue, 0)
      const efficiency = empJobs.length > 0
        ? Math.min(100, Math.round(empJobs.reduce((s, j) => s + (j.estimated_hours > 0 ? (j.estimated_hours / Math.max(j.actual_hours, 0.1)) * 100 : 100), 0) / empJobs.length))
        : 85
      return {
        name: emp.name.split(' ').map((n) => n[0] + '.').join(' ').replace('. ', ' ').trim() || emp.name,
        revenue,
        jobs: empJobs.length,
        efficiency,
      }
    })
    .filter((p) => (p.revenue ?? 0) > 0)
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
}

export function hasRevenueData(chart: ChartDataPoint[]): boolean {
  return chart.some((p) => (p.revenue ?? 0) > 0 || (p.profit ?? 0) > 0)
}

export function hasValueData(chart: ChartDataPoint[]): boolean {
  return chart.some((p) => (p.value ?? 0) > 0)
}

export function hasProfitData(chart: ChartDataPoint[]): boolean {
  return chart.some((p) => (p.profit ?? 0) > 0 || (p.jobs ?? 0) > 0)
}

export function hasTechnicianData(chart: ChartDataPoint[]): boolean {
  return chart.some((p) => (p.revenue ?? 0) > 0 || (p.jobs ?? 0) > 0)
}
