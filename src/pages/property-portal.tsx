import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Clock, DollarSign, CheckCircle, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/shared/skeleton'
import { useJobs, useInvoices, useSaveJob } from '@/hooks/use-entities'
import { usePortalContext } from '@/hooks/use-portal-context'
import { useAuth } from '@/contexts/auth-context'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { toast } from 'sonner'
import type { Job, Priority } from '@/types'

const PORTAL_CUSTOMER_ID = 'cust-001'

export default function PropertyPortalPage() {
  const { t } = useTranslation()
  const portal = usePortalContext('property')
  const { company } = useAuth()
  const companyId = portal?.companyId ?? company?.id ?? 'comp-001'
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: invoices = [], isLoading: invLoading } = useInvoices()
  const saveJob = useSaveJob()

  const portalJobs = jobs.filter((j) => j.customer_id === (portal?.customerId ?? PORTAL_CUSTOMER_ID))
  const openRequests = portalJobs.filter((j) => ['draft', 'scheduled', 'in_progress'].includes(j.status)).length
  const completed = portalJobs.filter((j) => j.status === 'completed').length
  const monthlySpend = invoices
    .filter((i) => i.customer_id === (portal?.customerId ?? PORTAL_CUSTOMER_ID))
    .reduce((s, i) => s + i.total, 0)

  const stats = [
    { label: t.propertyPortal.openRequests, value: openRequests, icon: Clock },
    { label: t.propertyPortal.completed, value: completed, icon: CheckCircle },
    { label: t.propertyPortal.monthlySpend, value: formatCurrency(monthlySpend), icon: DollarSign },
    { label: t.propertyPortal.avgResponse, value: '4.2 hrs', icon: Clock },
  ]

  const submitRequest = () => {
    if (title.length < 3 || description.length < 5) return

    const job: Job = {
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_id: portal?.customerId ?? PORTAL_CUSTOMER_ID,
      title,
      description,
      status: 'draft',
      priority,
      estimated_hours: 2,
      actual_hours: 0,
      revenue: 0,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }

    saveJob.mutate(job, {
      onSuccess: () => {
        toast.success(t.propertyPortal.requestSubmitted)
        setShowForm(false)
        setTitle('')
        setDescription('')
        setPriority('medium')
      },
    })
  }

  if (!portal) return <Navigate to="/login?portal=1" replace />
  if (jobsLoading || invLoading) return <div className="p-6"><TableSkeleton /></div>

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t.propertyPortal.title}</h1>
            <p className="text-muted-foreground">ABC Property Management</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />{t.propertyPortal.submitRequest}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.propertyPortal.submitRequest}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.propertyPortal.requestTitle}</Label>
                <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>{t.propertyPortal.requestDescription}</Label>
                <Textarea className="mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label>{t.jobs.priority}</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t.status.priority.low}</SelectItem>
                    <SelectItem value="medium">{t.status.priority.medium}</SelectItem>
                    <SelectItem value="high">{t.status.priority.high}</SelectItem>
                    <SelectItem value="emergency">{t.status.priority.emergency}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
                <Button onClick={submitRequest} disabled={saveJob.isPending}>{t.common.save}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">{t.propertyPortal.activeRequests}</h2>
        <div className="space-y-3">
          {portalJobs.filter((j) => j.status !== 'completed').map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <Badge variant="outline" className="mt-1">{job.status.replace('_', ' ')}</Badge>
                </div>
                <Button variant="outline" size="sm">{t.common.view}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
