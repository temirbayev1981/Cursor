import { Phone, Navigation, Camera, Clock, FileText, MapPin, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobStatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { DEMO_JOBS, DEMO_CUSTOMERS, DEMO_PROPERTIES } from '@/data/mock-data'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

export default function TechnicianMobilePage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
  const myJobs = DEMO_JOBS.filter((j) => j.assigned_technician_id === 'emp-002' || j.assigned_technician_id === 'emp-003')

  return (
    <div className="gradient-bg min-h-screen max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <h1 className="text-lg font-bold">{t.techMobile.myJobs}</h1>
        <p className="text-sm text-muted-foreground">Marcus Thompson · {t.techMobile.today}</p>
      </header>

      <div className="p-4 space-y-4">
        {myJobs.map((job) => {
          const customer = DEMO_CUSTOMERS.find((c) => c.id === job.customer_id)
          const property = DEMO_PROPERTIES.find((p) => p.id === job.property_id)
          return (
            <Card key={job.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{customer?.name}</p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>

                {property && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {property.address}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <PriorityBadge priority={job.priority} />
                  <span className="text-sm font-medium">{formatCurrency(job.revenue)}</span>
                </div>

                {job.scheduled_date && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(job.scheduled_date, dateLocale)}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button variant="outline" size="sm"><Phone className="h-4 w-4" />{t.common.call}</Button>
                  <Button variant="outline" size="sm"><Navigation className="h-4 w-4" />{t.common.navigate}</Button>
                  <Button variant="outline" size="sm"><Camera className="h-4 w-4" />{t.common.photo}</Button>
                </div>

                {job.status === 'in_progress' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm"><Clock className="h-4 w-4" />{t.techMobile.clockIn}</Button>
                    <Button variant="outline" size="sm"><FileText className="h-4 w-4" />{t.common.notes}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">{t.techMobile.gpsTracking}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.techMobile.arrival}</span>
                <span>9:12 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.techMobile.travelDistance}</span>
                <span>14.2 miles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.jobs.status}</span>
                <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />{t.techMobile.onSite}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
