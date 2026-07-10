import { formatCurrency } from '@/lib/utils'

export function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('profit') || entry.name === 'value')
            ? formatCurrency(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  )
}

export const CHART_PIE_COLORS = ['#0ea5e9', '#fbbf24', '#22c55e', '#ef4444', '#8b5cf6', '#f97316'] as const
