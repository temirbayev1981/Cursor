import { describe, it, expect } from 'vitest'
import {
  computeDashboardMetrics,
  computeServiceProfitability,
  computeTechnicianPerformance,
  computeRevenueChart,
  filterJobsByDateRange,
  computeReportSummary,
  computePeriodComparison,
  computeRangeComparison,
  hasRevenueData,
  hasValueData,
  localizeExpenseChart,
} from '@/lib/analytics'
import type { Job, Employee } from '@/types'

const job: Job = {
  id: 'j1',
  company_id: 'c1',
  customer_id: 'cust1',
  title: 'Drywall repair',
  description: '',
  status: 'completed',
  priority: 'medium',
  estimated_hours: 4,
  actual_hours: 5,
  revenue: 500,
  labor_cost: 200,
  material_cost: 50,
  fuel_cost: 10,
  overhead_cost: 20,
  profit: 220,
  profit_margin: 44,
  created_at: new Date().toISOString(),
  completed_date: new Date().toISOString(),
}

describe('analytics', () => {
  it('computes dashboard metrics from jobs', () => {
    const metrics = computeDashboardMetrics([job], [], [], [])
    expect(metrics.revenueMonth).toBe(500)
    expect(metrics.completedJobs).toBe(1)
  })

  it('reduces profit margin when overhead expenses exist', () => {
    const without = computeDashboardMetrics([job], [], [], [])
    const withExpense = computeDashboardMetrics([job], [], [{
      id: 'exp-1',
      company_id: 'c1',
      category: 'Overhead',
      description: 'Insurance',
      amount: 100,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }], [])
    expect(withExpense.profitMargin).toBeLessThan(without.profitMargin)
  })

  it('groups service profitability by keyword', () => {
    const chart = computeServiceProfitability([job])
    const drywall = chart.find((c) => c.name === 'Drywall')
    expect(drywall?.profit).toBe(220)
  })

  it('computes technician performance', () => {
    const emp: Employee = {
      id: 'e1',
      company_id: 'c1',
      name: 'James Rodriguez',
      role: 'Tech',
      hourly_wage: 25,
      billing_rate: 75,
      payroll_tax_rate: 0.07,
      insurance_cost_monthly: 200,
      benefits_monthly: 150,
      overhead_allocation: 0.1,
      is_active: true,
      skills: [],
      created_at: '',
    }
    const assigned = { ...job, assigned_technician_id: 'e1' }
    const perf = computeTechnicianPerformance([assigned], [emp])
    expect(perf[0]?.revenue).toBe(500)
  })

  it('detects empty vs populated chart data', () => {
    const chart = computeServiceProfitability([job])
    expect(hasRevenueData([{ name: 'Jan', revenue: 0, profit: 0 }])).toBe(false)
    expect(hasRevenueData(chart)).toBe(true)
    expect(hasValueData([{ name: 'Labor', value: 0 }])).toBe(false)
    expect(hasValueData([{ name: 'Labor', value: 100 }])).toBe(true)
  })

  it('filters jobs by date range', () => {
    const oldJob = { ...job, id: 'old', created_at: '2024-01-15T10:00:00.000Z', completed_date: undefined, scheduled_date: undefined }
    const recentJob = { ...job, id: 'recent', created_at: '2026-06-01T10:00:00.000Z', completed_date: undefined, scheduled_date: undefined }
    const filtered = filterJobsByDateRange([oldJob, recentJob], '2026-01-01', '2026-12-31')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('recent')
  })

  it('keeps revenue chart months separated by year', () => {
    const jan2024 = { ...job, id: 'j2024', created_at: '2024-01-10T10:00:00.000Z', completed_date: undefined, scheduled_date: undefined, revenue: 100, profit: 20 }
    const jan2025 = { ...job, id: 'j2025', created_at: '2025-01-10T10:00:00.000Z', completed_date: undefined, scheduled_date: undefined, revenue: 200, profit: 40 }
    const chart = computeRevenueChart([jan2024, jan2025])
    expect(chart).toHaveLength(2)
    expect(chart.find((point) => point.name === 'Jan 2024')?.revenue).toBe(100)
    expect(chart.find((point) => point.name === 'Jan 2025')?.revenue).toBe(200)
  })

  it('computes report summary totals', () => {
    const summary = computeReportSummary([job, { ...job, id: 'j2', revenue: 300, profit: 100 }])
    expect(summary.jobs).toBe(2)
    expect(summary.revenue).toBe(800)
    expect(summary.profit).toBe(320)
  })

  it('computes month-over-month period comparison', () => {
    const thisMonth = { ...job, id: 'current', created_at: new Date().toISOString(), completed_date: undefined, scheduled_date: undefined, revenue: 400 }
    const lastMonthDate = new Date()
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
    const lastMonth = {
      ...job,
      id: 'previous',
      created_at: lastMonthDate.toISOString(),
      completed_date: undefined,
      scheduled_date: undefined,
      revenue: 200,
    }
    const comparison = computePeriodComparison([thisMonth, lastMonth])
    expect(comparison.current.revenue).toBe(400)
    expect(comparison.previous.revenue).toBe(200)
    expect(comparison.revenueTrend).toBe(100)
  })

  it('computes range comparison against previous equal window', () => {
    const current = { ...job, id: 'c1', created_at: '2026-05-01T10:00:00.000Z', completed_date: undefined, scheduled_date: undefined, revenue: 500 }
    const previous = { ...job, id: 'p1', created_at: '2026-02-01T10:00:00.000Z', completed_date: undefined, scheduled_date: undefined, revenue: 250 }
    const comparison = computeRangeComparison([current, previous], '2026-04-01', '2026-06-30')
    expect(comparison.current.revenue).toBe(500)
    expect(comparison.previous.revenue).toBe(250)
    expect(comparison.revenueTrend).toBe(100)
  })

  it('localizes expense chart category labels', () => {
    const chart = [
      { name: 'Labor', value: 100 },
      { name: 'Materials', value: 50 },
      { name: 'Office', value: 25 },
    ]
    const localized = localizeExpenseChart(chart, {
      Labor: 'Труд',
      Materials: 'Материалы',
      Fuel: 'Топливо',
      Tools: 'Инструменты',
      Insurance: 'Страховка',
      Office: 'Офис',
      Other: 'Прочее',
    })
    expect(localized[0]?.name).toBe('Труд')
    expect(localized[1]?.name).toBe('Материалы')
    expect(localized[2]?.name).toBe('Офис')
  })

  it('keeps unknown expense categories unchanged', () => {
    const chart = [{ name: 'Custom', value: 10 }]
    const localized = localizeExpenseChart(chart, {
      Labor: 'Labor',
      Materials: 'Materials',
      Fuel: 'Fuel',
      Tools: 'Tools',
      Insurance: 'Insurance',
      Office: 'Office',
      Other: 'Other',
    })
    expect(localized[0]?.name).toBe('Custom')
  })
})
