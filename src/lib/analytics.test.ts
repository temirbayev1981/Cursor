import { describe, it, expect } from 'vitest'
import {
  computeDashboardMetrics,
  computeServiceProfitability,
  computeTechnicianPerformance,
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
})
