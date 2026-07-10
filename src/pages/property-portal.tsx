import { Plus, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_JOBS } from '@/data/mock-data'
import { formatCurrency } from '@/lib/utils'

export default function PropertyPortalPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Property Manager Portal</h1>
            <p className="text-muted-foreground">ABC Property Management</p>
          </div>
          <Button><Plus className="h-4 w-4" />Submit Request</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Open Requests', value: 3, icon: Clock },
            { label: 'Completed', value: 12, icon: CheckCircle },
            { label: 'Monthly Spend', value: formatCurrency(8450), icon: DollarSign },
            { label: 'Avg Response', value: '4.2 hrs', icon: Clock },
          ].map((stat) => (
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

        <h2 className="text-lg font-semibold mb-4">Active Requests</h2>
        <div className="space-y-3">
          {DEMO_JOBS.filter((j) => j.customer_id === 'cust-001').map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <Badge variant="outline" className="mt-1">{job.status.replace('_', ' ')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View</Button>
                  {job.status === 'scheduled' && <Button size="sm">Approve Estimate</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
