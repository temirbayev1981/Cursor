import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TablePagination } from '@/components/shared/table-pagination'
import { JobStatusBadge, PriorityBadge, ProfitIndicator } from '@/components/shared/status-badge'
import { TableSkeleton } from '@/components/shared/skeleton'
import { JobForm } from '@/components/forms/job-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useCustomers, useEmployees, useSaveJob, useBulkUpdateJobStatus, useBulkAssignTechnician, useBulkScheduleJobs, useBulkDeleteJobs } from '@/hooks/use-entities'
import { useServerEntityTable } from '@/hooks/use-server-entity-table'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import { JobMaterialUsageDialog } from '@/components/inventory/job-material-usage-dialog'
import type { Job, JobStatus } from '@/types'

const BULK_STATUSES: JobStatus[] = ['draft', 'scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled']

/** Up to 3 lines; wide columns avoid mid-word breaks and ellipsis for typical job text. */
const JOBS_TEXT_CELL = 'line-clamp-3 break-normal hyphens-none whitespace-normal leading-snug'

export default function JobsPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<JobStatus>('scheduled')
  const [bulkTechnicianId, setBulkTechnicianId] = useState('emp-002')
  const [bulkDeleteArmed, setBulkDeleteArmed] = useState(false)
  const { company } = useAuth()
  const companyId = company?.id ?? ''
  const { isLoading, pagination } = useServerEntityTable('jobs', {
    search,
    status: statusFilter,
  })
  const { data: customers = [] } = useCustomers()
  const { data: employees = [] } = useEmployees()
  const saveJob = useSaveJob()
  const bulkUpdateStatus = useBulkUpdateJobStatus()
  const bulkAssignTechnician = useBulkAssignTechnician()
  const bulkScheduleJobs = useBulkScheduleJobs()
  const bulkDeleteJobs = useBulkDeleteJobs()

  const activeTechnicians = employees.filter((e) => e.is_active && e.billing_rate > 0)

  useEffect(() => {
    setBulkDeleteArmed(false)
  }, [selectedIds])

  const filtered = pagination.paginatedItems
  const allFilteredSelected = filtered.length > 0 && filtered.every((job) => selectedIds.has(job.id))

  const toggleJob = (jobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const job of filtered) next.delete(job.id)
      } else {
        for (const job of filtered) next.add(job.id)
      }
      return next
    })
  }

  const handleBulkCancel = () => {
    const selected = filtered.filter((job) => selectedIds.has(job.id))
    if (selected.length === 0) return
    bulkUpdateStatus.mutate(
      { jobs: selected, status: 'cancelled' },
      {
        onSuccess: () => {
          toast.success(t.jobs.bulkCancelled.replace('{count}', String(selected.length)))
          setSelectedIds(new Set())
        },
      },
    )
  }

  const handleBulkDeleteClick = () => {
    const selected = filtered.filter((job) => selectedIds.has(job.id))
    if (selected.length === 0) return
    if (!bulkDeleteArmed) {
      setBulkDeleteArmed(true)
      return
    }
    bulkDeleteJobs.mutate(selected, {
      onSuccess: () => {
        toast.success(t.jobs.bulkDeleted.replace('{count}', String(selected.length)))
        setSelectedIds(new Set())
        setBulkDeleteArmed(false)
      },
    })
  }

  const handleBulkSchedule = () => {
    const selected = filtered.filter((job) => selectedIds.has(job.id))
    if (selected.length === 0) return
    bulkScheduleJobs.mutate(
      { jobs: selected, technicianId: bulkTechnicianId },
      {
        onSuccess: () => {
          toast.success(t.jobs.bulkScheduled.replace('{count}', String(selected.length)))
          setSelectedIds(new Set())
        },
      },
    )
  }

  const handleBulkAssign = () => {
    const selected = filtered.filter((job) => selectedIds.has(job.id))
    if (selected.length === 0) return
    bulkAssignTechnician.mutate(
      { jobs: selected, technicianId: bulkTechnicianId },
      {
        onSuccess: () => {
          toast.success(t.jobs.bulkAssigned.replace('{count}', String(selected.length)))
          setSelectedIds(new Set())
        },
      },
    )
  }

  const handleBulkApply = () => {
    const selected = filtered.filter((job) => selectedIds.has(job.id))
    if (selected.length === 0) return
    bulkUpdateStatus.mutate(
      { jobs: selected, status: bulkStatus },
      {
        onSuccess: () => {
          toast.success(t.jobs.bulkUpdated.replace('{count}', String(selected.length)))
          setSelectedIds(new Set())
        },
      },
    )
  }

  const handleCreate = (job: Job) => {
    saveJob.mutate(job, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
      },
    })
  }

  if (isLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader title={t.jobs.title} description={t.jobs.description}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />{t.jobs.newJob}</Button>} />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.jobs.newJob}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <JobForm companyId={companyId} customers={customers} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t.jobs.search} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="jobs-search" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{t.common.all}</TabsTrigger>
            <TabsTrigger value="scheduled">{t.jobs.scheduled}</TabsTrigger>
            <TabsTrigger value="in_progress">{t.jobs.inProgress}</TabsTrigger>
            <TabsTrigger value="completed">{t.jobs.completed}</TabsTrigger>
            <TabsTrigger value="draft">{t.jobs.draft}</TabsTrigger>
            <TabsTrigger value="on_hold" data-testid="jobs-tab-on-hold">{t.jobs.onHold}</TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="jobs-tab-cancelled">{t.jobs.cancelled}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              data-testid="jobs-select-all"
            />
            {t.jobs.selectAll}
          </label>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
          data-testid="jobs-bulk-bar"
        >
          <span className="text-sm font-medium">{t.jobs.bulkSelected.replace('{count}', String(selectedIds.size))}</span>
          <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as JobStatus)}>
            <SelectTrigger className="w-44 h-9" data-testid="jobs-bulk-status">
              <SelectValue placeholder={t.jobs.bulkStatus} />
            </SelectTrigger>
            <SelectContent>
              {BULK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t.status.job[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkApply} disabled={bulkUpdateStatus.isPending} data-testid="jobs-bulk-apply">
            {t.jobs.bulkApply}
          </Button>
          <Select value={bulkTechnicianId} onValueChange={setBulkTechnicianId}>
            <SelectTrigger className="w-48 h-9" data-testid="jobs-bulk-technician">
              <SelectValue placeholder={t.jobs.bulkTechnician} />
            </SelectTrigger>
            <SelectContent>
              {activeTechnicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkAssign}
            disabled={bulkAssignTechnician.isPending}
            data-testid="jobs-bulk-assign"
          >
            {t.jobs.bulkAssign}
          </Button>
          <Button
            size="sm"
            onClick={handleBulkSchedule}
            disabled={bulkScheduleJobs.isPending}
            data-testid="jobs-bulk-schedule"
          >
            {t.jobs.bulkSchedule}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkCancel}
            disabled={bulkUpdateStatus.isPending}
            data-testid="jobs-bulk-cancel"
          >
            {t.jobs.bulkCancel}
          </Button>
          <Button
            size="sm"
            variant={bulkDeleteArmed ? 'destructive' : 'outline'}
            onClick={handleBulkDeleteClick}
            disabled={bulkDeleteJobs.isPending}
            data-testid="jobs-bulk-delete"
          >
            {bulkDeleteArmed
              ? t.jobs.bulkDeleteConfirm.replace('{count}', String(selectedIds.size))
              : t.jobs.bulkDelete}
          </Button>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden space-y-3">
        {pagination.paginatedItems.map((job) => {
          const customer = customers.find((c) => c.id === job.customer_id)
          const tech = employees.find((e) => e.id === job.assigned_technician_id)
          return (
            <Card key={job.id} className="p-4" data-testid={`job-card-${job.id}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="rounded mt-1"
                  checked={selectedIds.has(job.id)}
                  onChange={() => toggleJob(job.id)}
                  data-testid={`job-select-${job.id}`}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className={cn('font-medium', JOBS_TEXT_CELL)}>{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.estimated_hours}{t.common.hours} {t.jobs.estimated}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <span className="text-muted-foreground">{t.jobs.customer}</span>
                    <span className={JOBS_TEXT_CELL}>{customer?.name ?? '—'}</span>
                    <span className="text-muted-foreground">{t.jobs.technician}</span>
                    <span className={JOBS_TEXT_CELL} data-testid={`job-technician-${job.id}`}>{tech?.name || '—'}</span>
                    <span className="text-muted-foreground">{t.jobs.revenue}</span>
                    <span className="font-medium">{formatCurrency(job.revenue)}</span>
                    <span className="text-muted-foreground">{t.jobs.scheduledDate}</span>
                    <span>{job.scheduled_date ? formatDate(job.scheduled_date, dateLocale) : '—'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <JobStatusBadge status={job.status} />
                    <PriorityBadge priority={job.priority} />
                    {job.profit_margin > 0 && <ProfitIndicator margin={job.profit_margin} />}
                    <JobMaterialUsageDialog job={job} companyId={companyId} />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        <TablePagination pagination={pagination} testId="jobs-pagination-mobile" />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:block">
        <DataTable
          tableClassName="min-w-[1320px]"
          headers={['', t.jobs.job, t.jobs.customer, t.jobs.technician, t.jobs.status, t.jobs.priority, t.jobs.revenue, t.jobs.profit, t.jobs.scheduledDate, '']}
          columnClassNames={[
            'w-10',
            'w-[20rem]',
            'w-[14rem]',
            'w-[10rem]',
            'w-[7rem]',
            'w-[6.5rem]',
            'w-[7rem]',
            'w-[5.5rem]',
            'w-[7.5rem]',
            'w-[4.5rem]',
          ]}
          pagination={pagination}
          paginationTestId="jobs-pagination"
        >
          {pagination.paginatedItems.map((job) => {
            const customer = customers.find((c) => c.id === job.customer_id)
            const tech = employees.find((e) => e.id === job.assigned_technician_id)
            return (
              <DataTableRow key={job.id}>
                <DataTableCell className="align-top">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedIds.has(job.id)}
                    onChange={() => toggleJob(job.id)}
                    data-testid={`job-select-${job.id}`}
                  />
                </DataTableCell>
                <DataTableCell className="align-top">
                  <div>
                    <p className={cn('font-medium', JOBS_TEXT_CELL)}>{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.estimated_hours}{t.common.hours} {t.jobs.estimated}</p>
                  </div>
                </DataTableCell>
                <DataTableCell className="align-top">
                  <span className={JOBS_TEXT_CELL}>{customer?.name ?? '—'}</span>
                </DataTableCell>
                <DataTableCell className="align-top" data-testid={`job-technician-${job.id}`}>
                  <span className={JOBS_TEXT_CELL}>{tech?.name || '—'}</span>
                </DataTableCell>
                <DataTableCell className="align-top"><JobStatusBadge status={job.status} /></DataTableCell>
                <DataTableCell className="align-top"><PriorityBadge priority={job.priority} /></DataTableCell>
                <DataTableCell className="align-top font-medium">{formatCurrency(job.revenue)}</DataTableCell>
                <DataTableCell className="align-top">{job.profit_margin > 0 ? <ProfitIndicator margin={job.profit_margin} /> : '—'}</DataTableCell>
                <DataTableCell className="align-top text-muted-foreground">
                  {job.scheduled_date ? formatDate(job.scheduled_date, dateLocale) : '—'}
                </DataTableCell>
                <DataTableCell className="align-top">
                  <JobMaterialUsageDialog job={job} companyId={companyId} />
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTable>
      </motion.div>
    </div>
  )
}
