import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { JobStatusBadge, PriorityBadge, ProfitIndicator } from '@/components/shared/status-badge'
import { TableSkeleton } from '@/components/shared/skeleton'
import { JobForm } from '@/components/forms/job-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useJobs, useCustomers, useEmployees, useSaveJob } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import { JobMaterialUsageDialog } from '@/components/inventory/job-material-usage-dialog'
import type { Job } from '@/types'

export default function JobsPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const { data: jobs = [], isLoading } = useJobs()
  const { data: customers = [] } = useCustomers()
  const { data: employees = [] } = useEmployees()
  const saveJob = useSaveJob()

  const filtered = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          <Input placeholder={t.jobs.search} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{t.common.all}</TabsTrigger>
            <TabsTrigger value="scheduled">{t.jobs.scheduled}</TabsTrigger>
            <TabsTrigger value="in_progress">{t.jobs.inProgress}</TabsTrigger>
            <TabsTrigger value="completed">{t.jobs.completed}</TabsTrigger>
            <TabsTrigger value="draft">Черновик</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <DataTable headers={[t.jobs.job, t.jobs.customer, t.jobs.technician, t.jobs.status, t.jobs.priority, t.jobs.revenue, t.jobs.profit, t.jobs.scheduledDate, '']}>
          {filtered.map((job) => {
            const customer = customers.find((c) => c.id === job.customer_id)
            const tech = employees.find((e) => e.id === job.assigned_technician_id)
            return (
              <DataTableRow key={job.id}>
                <DataTableCell>
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.estimated_hours}{t.common.hours} {t.jobs.estimated}</p>
                  </div>
                </DataTableCell>
                <DataTableCell>{customer?.name}</DataTableCell>
                <DataTableCell>{tech?.name || '—'}</DataTableCell>
                <DataTableCell><JobStatusBadge status={job.status} /></DataTableCell>
                <DataTableCell><PriorityBadge priority={job.priority} /></DataTableCell>
                <DataTableCell className="font-medium">{formatCurrency(job.revenue)}</DataTableCell>
                <DataTableCell>{job.profit_margin > 0 ? <ProfitIndicator margin={job.profit_margin} /> : '—'}</DataTableCell>
                <DataTableCell className="text-muted-foreground">
                  {job.scheduled_date ? formatDate(job.scheduled_date, dateLocale) : '—'}
                </DataTableCell>
                <DataTableCell>
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
