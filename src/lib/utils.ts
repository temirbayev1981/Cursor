import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: string | Date, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateTrueHourlyCost(employee: {
  hourly_wage: number
  payroll_tax_rate: number
  insurance_cost_monthly: number
  benefits_monthly: number
  overhead_allocation: number
  hours_per_month?: number
}): number {
  const hoursPerMonth = employee.hours_per_month ?? 160
  const taxCost = employee.hourly_wage * employee.payroll_tax_rate
  const insuranceHourly = employee.insurance_cost_monthly / hoursPerMonth
  const benefitsHourly = employee.benefits_monthly / hoursPerMonth
  return (
    employee.hourly_wage +
    taxCost +
    insuranceHourly +
    benefitsHourly +
    employee.overhead_allocation
  )
}

export function calculateProfitMargin(revenue: number, costs: number): number {
  if (revenue === 0) return 0
  return ((revenue - costs) / revenue) * 100
}
