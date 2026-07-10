import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobs, useUpdateJobStatus, useEmployees, useCustomers, useProperties } from '@/hooks/use-entities'
import { useTranslation } from '@/contexts/locale-context'
import { useOptimizedRoute } from '@/hooks/use-route-optimizer'
import { TableSkeleton } from '@/components/shared/skeleton'
import { PriorityBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { notifyTechnicianSms, notifyJobScheduled, notifyCustomerEta, notifyBulkTechnicianSms, notifyResultMessage } from '@/services/notification-service'
import { logAudit } from '@/services/entity-service'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import type { Job, JobStatus } from '@/types'
import { MapPin } from 'lucide-react'
import { JobMap } from '@/components/maps/job-map'
import { RouteOptimizerPanel } from '@/components/maps/route-optimizer-panel'

const COLUMNS: { status: JobStatus; color: string }[] = [
  { status: 'draft', color: 'border-muted-foreground' },
  { status: 'scheduled', color: 'border-primary' },
  { status: 'in_progress', color: 'border-warning' },
  { status: 'completed', color: 'border-success' },
]

const BOARD_STATUSES = COLUMNS.map((col) => col.status)

function JobCard({
  job,
  statusLabels,
  onStatusChange,
}: {
  job: Job
  statusLabels: Record<JobStatus, string>
  onStatusChange: (job: Job, status: JobStatus) => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg bg-secondary/40 border border-border p-3 space-y-2"
      data-testid={`dispatch-card-${job.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing space-y-2">
        <p className="text-sm font-medium line-clamp-2">{job.title}</p>
        <div className="flex items-center justify-between">
          <PriorityBadge priority={job.priority} />
          <span className="text-xs font-semibold">{formatCurrency(job.revenue)}</span>
        </div>
      </div>
      <Select
        value={job.status}
        onValueChange={(value) => onStatusChange(job, value as JobStatus)}
      >
        <SelectTrigger
          className="h-8 text-xs"
          data-testid={`dispatch-status-${job.id}`}
          aria-label={t.dispatch.statusSelect.replace('{title}', job.title)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SelectValue>{statusLabels[job.status]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {BOARD_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {statusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DispatchColumn({
  col,
  colJobs,
  statusLabels,
  onStatusChange,
}: {
  col: (typeof COLUMNS)[number]
  colJobs: Job[]
  statusLabels: Record<JobStatus, string>
  onStatusChange: (job: Job, status: JobStatus) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status })

  return (
    <Card className={`border-t-2 ${col.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{statusLabels[col.status]}</span>
          <Badge variant="outline">{colJobs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SortableContext items={colJobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={`space-y-2 min-h-[200px] ${isOver ? 'ring-2 ring-primary/40 rounded-lg' : ''}`}
            id={col.status}
            data-testid={`dispatch-column-${col.status}`}
          >
            {colJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                statusLabels={statusLabels}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  )
}

export default function DispatchPage() {
  const { t } = useTranslation()
  const { user, company } = useAuth()
  const { data: jobs = [], isLoading } = useJobs()
  const { data: employees = [] } = useEmployees()
  const { data: customers = [] } = useCustomers()
  const { data: properties = [] } = useProperties()
  const route = useOptimizedRoute(jobs, customers, properties)
  const updateStatus = useUpdateJobStatus()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [bulkSmsLoading, setBulkSmsLoading] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const statusLabels = t.status.job as Record<JobStatus, string>

  const handleJobStatusChange = useCallback(
    async (job: Job, newStatus: JobStatus) => {
      if (job.status === newStatus) return

      updateStatus.mutate({ job, status: newStatus })
      if (user && company) {
        void logAudit(company.id, user.id, 'dispatch.status_change', 'job', job.id)
      }

      if (newStatus === 'scheduled' && job.assigned_technician_id) {
        const tech = employees.find((emp) => emp.id === job.assigned_technician_id)
        const phone = tech?.phone
        if (phone) {
          const when = job.scheduled_date ? formatDateTime(job.scheduled_date) : t.dispatch.soon
          const result = await notifyTechnicianSms(
            phone,
            t.dispatch.smsBody.replace('{title}', job.title).replace('{when}', when),
          )
          const feedback = notifyResultMessage(
            result,
            t.dispatch.smsSent.replace('{name}', tech?.name ?? ''),
            t.dispatch.smsQueued.replace('{name}', tech?.name ?? '').replace('{title}', job.title),
            t.common.notificationFailed,
          )
          if (feedback.type === 'success') toast.success(feedback.message)
          else if (feedback.type === 'info') toast.info(feedback.message)
        }

        const customer = customers.find((c) => c.id === job.customer_id)
        if (customer?.email) {
          const when = job.scheduled_date ? formatDateTime(job.scheduled_date) : t.dispatch.soon
          const emailResult = await notifyJobScheduled(customer.email, job.title, when, customer.id)
          const emailFeedback = notifyResultMessage(
            emailResult,
            t.dispatch.customerEmailSent.replace('{email}', customer.email),
            t.dispatch.customerEmailQueued.replace('{email}', customer.email),
            t.common.notificationFailed,
          )
          if (emailFeedback.type === 'success') toast.success(emailFeedback.message)
          else if (emailFeedback.type === 'info') toast.info(emailFeedback.message)
        }
      }

      if (newStatus === 'in_progress') {
        const customer = customers.find((c) => c.id === job.customer_id)
        if (customer?.email) {
          const eta = t.dispatch.etaDefault
          const etaResult = await notifyCustomerEta(customer.email, job.title, eta, customer.id)
          const etaFeedback = notifyResultMessage(
            etaResult,
            t.dispatch.customerEtaSent.replace('{email}', customer.email),
            t.dispatch.customerEtaQueued.replace('{email}', customer.email),
            t.common.notificationFailed,
          )
          if (etaFeedback.type === 'success') toast.success(etaFeedback.message)
          else if (etaFeedback.type === 'info') toast.info(etaFeedback.message)
        }
      }
    },
    [company, customers, employees, t, updateStatus, user],
  )

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const jobId = String(e.active.id)
    const overId = e.over?.id
    if (!overId) return

    let newStatus: JobStatus | undefined
    if (BOARD_STATUSES.includes(overId as JobStatus)) {
      newStatus = overId as JobStatus
    } else {
      newStatus = jobs.find((j) => j.id === overId)?.status
    }
    if (!newStatus) return

    const job = jobs.find((j) => j.id === jobId)
    if (job) await handleJobStatusChange(job, newStatus)
  }

  const activeJob = jobs.find((j) => j.id === activeId)

  const handleBulkTechnicianSms = async () => {
    const scheduledJobs = jobs.filter((j) => j.status === 'scheduled' && j.assigned_technician_id)
    const counts = new Map<string, number>()
    for (const job of scheduledJobs) {
      const techId = job.assigned_technician_id!
      counts.set(techId, (counts.get(techId) ?? 0) + 1)
    }

    const technicians = employees
      .filter((emp) => counts.has(emp.id))
      .map((emp) => ({ phone: emp.phone, jobCount: counts.get(emp.id) ?? 0 }))

    if (technicians.length === 0) {
      toast.info(t.dispatch.bulkSmsNone)
      return
    }

    setBulkSmsLoading(true)
    try {
      const result = await notifyBulkTechnicianSms(technicians)
      toast.success(
        t.dispatch.bulkSmsDone
          .replace('{sent}', String(result.sent))
          .replace('{queued}', String(result.queued)),
      )
    } finally {
      setBulkSmsLoading(false)
    }
  }

  if (isLoading) return <TableSkeleton rows={4} cols={4} />

  return (
    <div>
      <PageHeader title={t.dispatch.title} description={t.dispatch.description} />

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          data-testid="dispatch-bulk-sms"
          disabled={bulkSmsLoading}
          onClick={() => void handleBulkTechnicianSms()}
        >
          {t.dispatch.bulkSms}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col.status)
            return (
              <DispatchColumn
                key={col.status}
                col={col}
                colJobs={colJobs}
                statusLabels={statusLabels}
                onStatusChange={(j, status) => void handleJobStatusChange(j, status)}
              />
            )
          })}
        </div>
        <DragOverlay>
          {activeJob && (
            <JobCard
              job={activeJob}
              statusLabels={statusLabels}
              onStatusChange={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card data-testid="dispatch-job-map">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{t.dispatch.jobMapTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <JobMap
              addresses={route.stops.map((s) => s.address)}
              className="h-48"
            />
          </CardContent>
        </Card>
        <RouteOptimizerPanel
          stops={route.stops}
          savedMiles={route.savedMiles}
          savedMinutes={route.savedMinutes}
          totalMiles={route.totalMiles}
          mapsUrl={route.mapsUrl}
          jobCount={route.jobCount}
        />
      </div>
    </div>
  )
}
