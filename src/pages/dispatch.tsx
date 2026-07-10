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
import { useJobs, useUpdateJobStatus } from '@/hooks/use-entities'
import { useTranslation } from '@/contexts/locale-context'
import { TableSkeleton } from '@/components/shared/skeleton'
import { PriorityBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import type { Job, JobStatus } from '@/types'
import { MapPin } from 'lucide-react'

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
  const { t } = useTranslation()
  const { data: jobs = [], isLoading } = useJobs()
  const updateStatus = useUpdateJobStatus()
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const jobId = String(e.active.id)
    const newStatus = e.over?.id as JobStatus | undefined
    if (!newStatus) return
    const job = jobs.find((j) => j.id === jobId)
    if (job && job.status !== newStatus) {
      updateStatus.mutate({ job, status: newStatus })
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Карта объектов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-secondary/30 h-48 flex items-center justify-center text-muted-foreground text-sm">
            Google Maps API — подключите VITE_GOOGLE_MAPS_API_KEY для отображения маршрутов
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
