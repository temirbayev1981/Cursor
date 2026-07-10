import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { JobStatusBadge, PriorityBadge, ProfitIndicator } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEMO_JOBS, DEMO_CUSTOMERS, DEMO_EMPLOYEES } from '@/data/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = DEMO_JOBS.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Manage all active and completed jobs"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <DataTable headers={['Job', 'Customer', 'Technician', 'Status', 'Priority', 'Revenue', 'Profit', 'Scheduled']}>
          {filtered.map((job) => {
            const customer = DEMO_CUSTOMERS.find((c) => c.id === job.customer_id)
            const tech = DEMO_EMPLOYEES.find((e) => e.id === job.assigned_technician_id)
            return (
              <DataTableRow key={job.id}>
                <DataTableCell>
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.estimated_hours}h estimated</p>
                  </div>
                </DataTableCell>
                <DataTableCell>{customer?.name}</DataTableCell>
                <DataTableCell>{tech?.name || '—'}</DataTableCell>
                <DataTableCell><JobStatusBadge status={job.status} /></DataTableCell>
                <DataTableCell><PriorityBadge priority={job.priority} /></DataTableCell>
                <DataTableCell className="font-medium">{formatCurrency(job.revenue)}</DataTableCell>
                <DataTableCell>
                  {job.profit_margin > 0 ? <ProfitIndicator margin={job.profit_margin} /> : '—'}
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">
                  {job.scheduled_date ? formatDate(job.scheduled_date) : '—'}
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTable>
      </motion.div>
    </div>
  )
}
