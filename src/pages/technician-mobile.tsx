import { useState, useEffect } from 'react'
import { Phone, Navigation, Camera, Clock, CheckCircle, Play, Square, PenLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobStatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { useJobs, useEmployees } from '@/hooks/use-entities'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { loadStore, saveStore, STORE_KEYS } from '@/lib/data-store'
import { toast } from 'sonner'

interface TimeEntry {
  id: string
  job_id: string
  start: string
  end?: string
  lat?: number
  lng?: number
}

export default function TechnicianMobilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: jobs = [] } = useJobs()
  const { data: employees = [] } = useEmployees()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)

  const tech = employees.find((e) => e.billing_rate > 0)
  const myJobs = jobs.filter((j) =>
    j.status === 'scheduled' || j.status === 'in_progress'
  ).slice(0, 5)

  useEffect(() => {
    setTimeEntries(loadStore<TimeEntry>(STORE_KEYS.timeEntries))
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    }
  }, [])

  const clockIn = (jobId: string) => {
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      job_id: jobId,
      start: new Date().toISOString(),
      lat: gps?.lat,
      lng: gps?.lng,
    }
    const next = [entry, ...timeEntries]
    setTimeEntries(next)
    saveStore(STORE_KEYS.timeEntries, next)
    setActiveJobId(jobId)
    toast.success('Отметка прихода записана')
  }

  const clockOut = () => {
    if (!activeJobId) return
    const next = timeEntries.map((e) =>
      e.job_id === activeJobId && !e.end ? { ...e, end: new Date().toISOString() } : e
    )
    setTimeEntries(next)
    saveStore(STORE_KEYS.timeEntries, next)
    setActiveJobId(null)
    toast.success('Отметка ухода записана')
  }

  return (
    <div className="gradient-bg min-h-screen max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <h1 className="text-lg font-bold">{t.techMobile.myJobs}</h1>
        <p className="text-sm text-muted-foreground">{tech?.name ?? user?.full_name} · {t.techMobile.today}</p>
      </header>

      <div className="p-4 space-y-4">
        {myJobs.map((job) => (
          <Card key={job.id} className={activeJobId === job.id ? 'border-primary' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <p className="font-semibold">{job.title}</p>
                <JobStatusBadge status={job.status} />
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={job.priority} />
                <span className="text-sm font-medium">{formatCurrency(job.revenue)}</span>
              </div>
              {job.scheduled_date && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(job.scheduled_date)}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open('tel:+15551234567')}>
                  <Phone className="h-4 w-4" />{t.common.call}
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('https://maps.google.com')}>
                  <Navigation className="h-4 w-4" />{t.common.navigate}
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4" />{t.common.photo}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeJobId === job.id ? (
                  <Button size="sm" variant="destructive" onClick={clockOut}>
                    <Square className="h-4 w-4" />Уйти
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => clockIn(job.id)}>
                    <Play className="h-4 w-4" />{t.techMobile.clockIn}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <PenLine className="h-4 w-4" />{t.common.notes}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">{t.techMobile.gpsTracking}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.techMobile.arrival}</span>
                <span>{activeJobId ? new Date().toLocaleTimeString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPS</span>
                <span>{gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус</span>
                <Badge variant={activeJobId ? 'success' : 'outline'}>
                  {activeJobId ? <><CheckCircle className="h-3 w-3 mr-1" />{t.techMobile.onSite}</> : 'Вне объекта'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
