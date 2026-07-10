import { Plus, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/shared/skeleton'
import { useJobs, useInvoices } from '@/hooks/use-entities'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

const PORTAL_CUSTOMER_ID = 'cust-001'

export default function PropertyPortalPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading: jobsLoading } = useJobs()
  const { data: invoices = [], isLoading: invLoading } = useInvoices()

  const portalJobs = jobs.filter((j) => j.customer_id === PORTAL_CUSTOMER_ID)
  const openRequests = portalJobs.filter((j) => ['draft', 'scheduled', 'in_progress'].includes(j.status)).length
  const completed = portalJobs.filter((j) => j.status === 'completed').length
  const monthlySpend = invoices
    .filter((i) => i.customer_id === PORTAL_CUSTOMER_ID)
    .reduce((s, i) => s + i.total, 0)

  const stats = [
    { label: t.propertyPortal.openRequests, value: openRequests, icon: Clock },
    { label: t.propertyPortal.completed, value: completed, icon: CheckCircle },
    { label: t.propertyPortal.monthlySpend, value: formatCurrency(monthlySpend), icon: DollarSign },
    { label: t.propertyPortal.avgResponse, value: '4.2 hrs', icon: Clock },
  ]

  if (jobsLoading || invLoading) return <div className="p-6"><TableSkeleton /></div>

  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t.propertyPortal.title}</h1>
            <p className="text-muted-foreground">ABC Property Management</p>
          </div>
          <Button><Plus className="h-4 w-4" />{t.propertyPortal.submitRequest}</Button>
        </div>

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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">{t.common.view}</Button>
                  {job.status === 'scheduled' && <Button size="sm">{t.propertyPortal.approveEstimate}</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
