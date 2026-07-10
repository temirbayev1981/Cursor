import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useJobs, useUpdateJobStatus, useEmployees, useCustomers, useProperties } from '@/hooks/use-entities'
import { useTranslation } from '@/contexts/locale-context'
import { useOptimizedRoute } from '@/hooks/use-route-optimizer'
import { TableSkeleton } from '@/components/shared/skeleton'
import { PriorityBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { notifyTechnicianSms, notifyJobScheduled, notifyResultMessage } from '@/services/notification-service'
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

function JobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="rounded-lg bg-secondary/40 border border-border p-3 cursor-grab active:cursor-grabbing space-y-2">
      <p className="text-sm font-medium line-clamp-2">{job.title}</p>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={job.priority} />
        <span className="text-xs font-semibold">{formatCurrency(job.revenue)}</span>
      </div>
    </div>
  )
}

export default function DispatchPage() {
  const { t, locale } = useTranslation()
  const { data: jobs = [], isLoading } = useJobs()
  const { data: employees = [] } = useEmployees()
  const { data: customers = [] } = useCustomers()
  const { data: properties = [] } = useProperties()
  const route = useOptimizedRoute(jobs, customers, properties)
  const updateStatus = useUpdateJobStatus()
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const jobId = String(e.active.id)
    const newStatus = e.over?.id as JobStatus | undefined
    if (!newStatus) return
    const job = jobs.find((j) => j.id === jobId)
    if (job && job.status !== newStatus) {
      updateStatus.mutate({ job, status: newStatus })
      if (newStatus === 'scheduled' && job.assigned_technician_id) {
        const tech = employees.find((emp) => emp.id === job.assigned_technician_id)
        const phone = tech?.phone
        if (phone) {
          const when = job.scheduled_date ? formatDateTime(job.scheduled_date) : 'скоро'
          const result = await notifyTechnicianSms(
            phone,
            `Новый заказ: ${job.title}. Запланирован на ${when}.`
          )
          const feedback = notifyResultMessage(
            result,
            locale,
            `SMS отправлено: ${tech?.name}`,
            `SMS (демо) → ${tech?.name}: ${job.title}`,
          )
          if (feedback.type === 'success') toast.success(feedback.message)
          else if (feedback.type === 'info') toast.info(feedback.message)
        }

        const customer = customers.find((c) => c.id === job.customer_id)
        if (customer?.email) {
          const when = job.scheduled_date ? formatDateTime(job.scheduled_date) : (locale === 'ru' ? 'скоро' : 'soon')
          const emailResult = await notifyJobScheduled(customer.email, job.title, when)
          const emailFeedback = notifyResultMessage(
            emailResult,
            locale,
            locale === 'ru' ? `Email клиенту: ${customer.email}` : `Customer email: ${customer.email}`,
            locale === 'ru' ? `Email (демо) → ${customer.email}` : `Email (demo) → ${customer.email}`,
          )
          if (emailFeedback.type === 'success') toast.success(emailFeedback.message)
          else if (emailFeedback.type === 'info') toast.info(emailFeedback.message)
        }
      }
    }
  }

  const activeJob = jobs.find((j) => j.id === activeId)

  if (isLoading) return <TableSkeleton rows={4} cols={4} />

  return (
    <div>
      <PageHeader title="Диспетчерская" description="Kanban-доска заказов с drag-and-drop" />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col.status)
            return (
              <Card key={col.status} className={`border-t-2 ${col.color}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{t.status.job[col.status]}</span>
                    <Badge variant="outline">{colJobs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SortableContext items={colJobs.map((j) => j.id)} strategy={verticalListSortingStrategy} id={col.status}>
                    <div className="space-y-2 min-h-[200px]" id={col.status}>
                      {colJobs.map((job) => <JobCard key={job.id} job={job} />)}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <DragOverlay>
          {activeJob && <JobCard job={activeJob} />}
        </DragOverlay>
      </DndContext>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Карта объектов</CardTitle>
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
