import { Badge } from '@/components/ui/badge'
import type { EstimateStatus, InvoiceStatus, JobStatus, Priority } from '@/types'

const jobStatusMap: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  on_hold: { label: 'On Hold', variant: 'secondary' },
}

const estimateStatusMap: Record<EstimateStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  sent: { label: 'Sent', variant: 'default' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
}

const invoiceStatusMap: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  sent: { label: 'Sent', variant: 'default' },
  paid: { label: 'Paid', variant: 'success' },
  partial: { label: 'Partial', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
}

const priorityMap: Record<Priority, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'warning' },
  emergency: { label: 'Emergency', variant: 'destructive' },
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = jobStatusMap[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  const config = estimateStatusMap[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = invoiceStatusMap[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityMap[priority]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function ProfitIndicator({ margin }: { margin: number }) {
  const variant = margin >= 40 ? 'success' : margin >= 25 ? 'warning' : 'destructive'
  return <Badge variant={variant}>{margin.toFixed(1)}% margin</Badge>
}
