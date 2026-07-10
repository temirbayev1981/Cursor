import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Clock, DollarSign, CheckCircle, X, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/shared/skeleton'
import { usePortalContext } from '@/hooks/use-portal-context'
import { usePortalJobs, usePortalInvoices, usePortalJobSubmit } from '@/hooks/use-portal-data'
import { clearPortalSession } from '@/services/portal-service'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { toast } from 'sonner'
import type { Priority } from '@/types'

export default function PropertyPortalPage() {
  const { t } = useTranslation()
  const portal = usePortalContext('property')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const { data: portalJobs = [], isLoading: jobsLoading } = usePortalJobs()
  const { data: invoices = [], isLoading: invLoading } = usePortalInvoices('property')
  const submitJob = usePortalJobSubmit()

  const openRequests = portalJobs.filter((j) => ['draft', 'scheduled', 'in_progress'].includes(j.status)).length
  const completed = portalJobs.filter((j) => j.status === 'completed').length
  const monthlySpend = invoices.reduce((s, i) => s + i.total, 0)

  const stats = [
    { label: t.propertyPortal.openRequests, value: openRequests, icon: Clock },
    { label: t.propertyPortal.completed, value: completed, icon: CheckCircle },
    { label: t.propertyPortal.monthlySpend, value: formatCurrency(monthlySpend), icon: DollarSign },
    { label: t.propertyPortal.avgResponse, value: '4.2 hrs', icon: Clock },
  ]

  const submitRequest = () => {
    if (!portal || title.length < 3 || description.length < 5) return

    submitJob.mutate(
      {
        id: crypto.randomUUID(),
        company_id: portal.companyId,
        customer_id: portal.customerId,
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
      },
      {
        onSuccess: () => {
          toast.success(t.propertyPortal.requestSubmitted)
          setShowForm(false)
          setTitle('')
          setDescription('')
          setPriority('medium')
        },
      },
    )
  }

  const handleLogout = () => {
    clearPortalSession()
    window.location.href = '/login?portal=1'
  }

  if (!portal) return <Navigate to="/login?portal=1" replace />
  if (jobsLoading || invLoading) return <div className="safe-x p-4 sm:p-6"><TableSkeleton /></div>

  return (
    <div className="gradient-bg safe-x min-h-[100dvh]">
      <div className="safe-top safe-bottom mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">{t.propertyPortal.title}</h1>
            <p className="text-sm text-muted-foreground sm:text-base">{portal.customerName}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />{t.propertyPortal.submitRequest}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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
                  <SelectTrigger className="mt-1 w-full sm:w-48"><SelectValue /></SelectTrigger>
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
                <Button onClick={submitRequest} disabled={submitJob.isPending}>{t.common.save}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <stat.icon className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">{t.propertyPortal.activeRequests}</h2>
        <div className="space-y-3">
          {portalJobs.filter((j) => j.status !== 'completed').map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{job.title}</p>
                  <Badge variant="outline" className="mt-1">{job.status.replace('_', ' ')}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
