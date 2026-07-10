import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: number
  format?: 'currency' | 'percent' | 'number'
  className?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  format = 'number',
  className,
  delay = 0,
}: StatCardProps) {
  const { t } = useTranslation()

  const formattedValue =
    format === 'currency' && typeof value === 'number'
      ? formatCurrency(value)
      : format === 'percent' && typeof value === 'number'
        ? formatPercent(value)
        : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn('glass-card p-5', className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-success' : 'text-destructive')}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% {t.common.vsLastMonth}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </motion.div>
  )
}
