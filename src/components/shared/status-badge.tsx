import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/contexts/locale-context'
import type { EstimateStatus, InvoiceStatus, JobStatus, Priority } from '@/types'

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { t } = useTranslation()
  const label = t.status.job[status]
  const variant =
    status === 'completed' ? 'success'
    : status === 'in_progress' ? 'warning'
    : status === 'cancelled' ? 'destructive'
    : status === 'scheduled' ? 'default'
    : 'outline'
  return <Badge variant={variant}>{label}</Badge>
}

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  const { t } = useTranslation()
  const label = t.status.estimate[status]
  const variant =
    status === 'approved' ? 'success'
    : status === 'rejected' ? 'destructive'
    : status === 'sent' ? 'default'
    : 'outline'
  return <Badge variant={variant}>{label}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation()
  const label = t.status.invoice[status]
  const variant =
    status === 'paid' ? 'success'
    : status === 'overdue' ? 'destructive'
    : status === 'partial' ? 'warning'
    : status === 'sent' ? 'default'
    : 'outline'
  return <Badge variant={variant}>{label}</Badge>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation()
  const label = t.status.priority[priority]
  const variant =
    priority === 'emergency' ? 'destructive'
    : priority === 'high' ? 'warning'
    : priority === 'medium' ? 'default'
    : 'outline'
  return <Badge variant={variant}>{label}</Badge>
}

export function ProfitIndicator({ margin }: { margin: number }) {
  const { t } = useTranslation()
  const variant = margin >= 40 ? 'success' : margin >= 25 ? 'warning' : 'destructive'
  return <Badge variant={variant}>{margin.toFixed(1)}% {t.status.margin}</Badge>
}
