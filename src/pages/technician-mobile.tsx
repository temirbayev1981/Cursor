import { useState, useEffect, useRef, useMemo } from 'react'
import { Phone, Navigation, Camera, Clock, CheckCircle, Play, Square, WifiOff, CloudOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobStatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { useJobs, useEmployees, useCustomerContacts, useProperties, useUpdateJobStatus, useSaveJob } from '@/hooks/use-entities'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { loadStore, saveStore, upsertStore, STORE_KEYS } from '@/lib/data-store'
import { queueOfflineAction, getOfflineQueue, syncOfflineQueue } from '@/lib/pwa'
import { applyOfflineAction } from '@/services/offline-sync-service'
import { uploadJobPhoto } from '@/services/storage-service'
import { resolveJobAddress } from '@/hooks/use-route-optimizer'
import { buildGoogleMapsDirectionsUrl, geocodeAddressForRouting } from '@/lib/route-optimizer'
import { fileToBase64 } from '@/lib/file-utils'
import { JobNotesDialog } from '@/components/jobs/job-notes-dialog'
import { toast } from 'sonner'
import type { Job, JobStatus } from '@/types'

interface LocalTimeEntry {
  id: string
  job_id: string
  start: string
  end?: string
  lat?: number
  lng?: number
}

export default function TechnicianMobilePage() {
  const { t } = useTranslation()
  const { user, company } = useAuth()
  const online = useOnlineStatus()
  const qc = useQueryClient()
  const companyId = company?.id ?? ''
  const { data: jobs = [] } = useJobs()
  const { data: employees = [] } = useEmployees()
  const { data: customers = [] } = useCustomerContacts()
  const { data: properties = [] } = useProperties()
  const updateStatus = useUpdateJobStatus()
  const saveJob = useSaveJob()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [timeEntries, setTimeEntries] = useState<LocalTimeEntry[]>([])
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [pendingSync, setPendingSync] = useState(0)
  const [uploadingJobId, setUploadingJobId] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoJobRef = useRef<string | null>(null)

  const myEmployee =
    employees.find((e) => e.profile_id === user?.id) ??
    employees.find((e) => e.is_active && e.billing_rate > 0 && /technician/i.test(e.role))

  const syncContext = useMemo(
    () => ({
      companyId,
      employeeId: myEmployee?.id,
      profileId: user?.id,
    }),
    [companyId, myEmployee?.id, user?.id],
  )

  const myJobs = jobs
    .filter((j) => {
      const assigned = !myEmployee || j.assigned_technician_id === myEmployee.id
      return assigned && (j.status === 'scheduled' || j.status === 'in_progress')
    })
    .slice(0, 10)

  const activeEntry = activeJobId
    ? timeEntries.find((e) => e.job_id === activeJobId && !e.end)
    : undefined

  const activeEntryStart = activeEntry?.start
    ?? (activeEntry as { start_time?: string } | undefined)?.start_time

  useEffect(() => {
    if (!supabase || !myEmployee?.id) return
    const client = supabase

    const channel = client
      .channel(`jobs:tech:${myEmployee.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `assigned_technician_id=eq.${myEmployee.id}`,
        },
        () => { void qc.invalidateQueries({ queryKey: ['jobs', companyId] }) },
      )
      .subscribe()

    return () => { void client.removeChannel(channel) }
  }, [myEmployee?.id, companyId, qc])

  useEffect(() => {
    setTimeEntries(loadStore<LocalTimeEntry>(STORE_KEYS.timeEntries))
    setPendingSync(getOfflineQueue().length)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true },
      )
    }
  }, [])

  useEffect(() => {
    if (!activeJobId || !('geolocation' in navigator)) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [activeJobId])

  useEffect(() => {
    if (!online || getOfflineQueue().length === 0) return

    void (async () => {
      const { processed } = await syncOfflineQueue((action) =>
        applyOfflineAction(action, syncContext)
      )

      setTimeEntries(loadStore<LocalTimeEntry>(STORE_KEYS.timeEntries))
      setPendingSync(getOfflineQueue().length)
      if (processed > 0) {
        void qc.invalidateQueries({ queryKey: ['jobs', companyId] })
        toast.info(t.techMobile.synced)
      }
    })()
  }, [online, t.techMobile.synced, syncContext, qc, companyId])

  const getJobPhone = (job: Job) => customers.find((c) => c.id === job.customer_id)?.phone

  const openNavigate = (job: Job) => {
    const address = resolveJobAddress(job, customers, properties)
    const stop = { id: job.id, label: job.title, address, ...geocodeAddressForRouting(address) }
    window.open(buildGoogleMapsDirectionsUrl([stop]), '_blank', 'noopener,noreferrer')
  }

  const persistJobUpdate = (updated: Job, successMessage: string, offlineActionType: 'update_job' | 'update_job_status' = 'update_job') => {
    upsertStore(STORE_KEYS.jobs, updated)
    void qc.invalidateQueries({ queryKey: ['jobs', companyId] })

    if (!online) {
      queueOfflineAction(offlineActionType, { job: updated })
      setPendingSync(getOfflineQueue().length)
      toast.success(t.techMobile.offlineSaved)
      return
    }

    saveJob.mutate(updated, { onSuccess: () => toast.success(successMessage) })
  }

  const changeJobStatus = (job: Job, status: JobStatus) => {
    const updated: Job = {
      ...job,
      status,
      ...(status === 'completed' ? { completed_date: new Date().toISOString() } : {}),
    }

    if (!online) {
      persistJobUpdate(updated, t.techMobile.statusUpdated, 'update_job_status')
      return
    }

    updateStatus.mutate(
      { job: updated, status },
      { onSuccess: () => toast.success(t.techMobile.statusUpdated) },
    )
  }

  const saveJobNotes = (job: Job, notes: string) => {
    persistJobUpdate({ ...job, description: notes }, t.techMobile.notesSaved)
  }

  const queuePhotoUpload = async (file: File, jobId: string) => {
    const data = await fileToBase64(file)
    queueOfflineAction('photo_upload', {
      companyId,
      jobId,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      data,
    })
    setPendingSync(getOfflineQueue().length)
    toast.success(t.techMobile.photoQueued)
  }

  const clockIn = (jobId: string) => {
    const entry: LocalTimeEntry = {
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

    if (!online) {
      queueOfflineAction('clock_in', entry)
      setPendingSync(getOfflineQueue().length)
      toast.success(t.techMobile.offlineSaved)
    } else {
      void applyOfflineAction({ id: entry.id, type: 'clock_in', payload: entry, created_at: entry.start }, syncContext)
      toast.success(t.techMobile.clockIn)
    }
  }

  const clockOut = () => {
    if (!activeJobId) return
    const end = new Date().toISOString()
    const next = timeEntries.map((e) =>
      e.job_id === activeJobId && !e.end ? { ...e, end } : e
    )
    setTimeEntries(next)
    saveStore(STORE_KEYS.timeEntries, next)
    setActiveJobId(null)

    if (!online) {
      queueOfflineAction('clock_out', { job_id: activeJobId, end })
      setPendingSync(getOfflineQueue().length)
    } else {
      void applyOfflineAction(
        { id: crypto.randomUUID(), type: 'clock_out', payload: { job_id: activeJobId, end }, created_at: end },
        syncContext
      )
    }
    toast.success(t.techMobile.clockOut)
  }

  const openPhotoPicker = (jobId: string) => {
    photoJobRef.current = jobId
    photoInputRef.current?.click()
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const jobId = photoJobRef.current
    e.target.value = ''
    if (!file || !jobId) return

    setUploadingJobId(jobId)
    try {
      if (!online) {
        await queuePhotoUpload(file, jobId)
      } else {
        try {
          await uploadJobPhoto(file, companyId, jobId)
          toast.success(t.techMobile.photoSaved)
        } catch {
          await queuePhotoUpload(file, jobId)
        }
      }
    } catch {
      toast.error(t.techMobile.uploadFailed)
    } finally {
      setUploadingJobId(null)
      photoJobRef.current = null
    }
  }

  return (
    <div className="gradient-bg safe-x mx-auto min-h-[100dvh] max-w-md">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="tech-photo-input"
        onChange={(e) => void handlePhotoSelected(e)}
      />

      <header className="safe-top sticky top-0 z-10 border-b border-border bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">{t.techMobile.myJobs}</h1>
            <p className="text-sm text-muted-foreground">
              {myEmployee?.name ?? user?.full_name} · {t.techMobile.today}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1" aria-live="polite">
            <Badge variant={online ? 'success' : 'destructive'} className="text-xs">
              {online ? t.techMobile.online : <><WifiOff className="h-3 w-3 mr-1" />{t.techMobile.offline}</>}
            </Badge>
            {pendingSync > 0 && (
              <Badge variant="outline" className="text-xs">
                <CloudOff className="h-3 w-3 mr-1" />
                {pendingSync} {t.techMobile.pendingSync}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="safe-bottom space-y-4 p-4">
        {myJobs.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              {t.techMobile.noJobs}
            </CardContent>
          </Card>
        )}

        {myJobs.map((job) => {
          const phone = getJobPhone(job)
          const address = resolveJobAddress(job, customers, properties)

          return (
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
                <p className="text-xs text-muted-foreground truncate">{address}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!phone}
                    onClick={() => phone && window.open(`tel:${phone}`)}
                  >
                    <Phone className="h-4 w-4" />{t.common.call}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openNavigate(job)}>
                    <Navigation className="h-4 w-4" />{t.common.navigate}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingJobId === job.id}
                    onClick={() => openPhotoPicker(job.id)}
                  >
                    <Camera className="h-4 w-4" />{t.common.photo}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeJobId === job.id ? (
                    <Button size="sm" variant="destructive" onClick={clockOut}>
                      <Square className="h-4 w-4" />{t.techMobile.clockOut}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => clockIn(job.id)}>
                      <Play className="h-4 w-4" />{t.techMobile.clockIn}
                    </Button>
                  )}
                  <JobNotesDialog
                    job={job}
                    onSave={saveJobNotes}
                    isSaving={saveJob.isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {job.status === 'scheduled' && (
                    <Button size="sm" variant="secondary" onClick={() => changeJobStatus(job, 'in_progress')}>
                      {t.techMobile.startJob}
                    </Button>
                  )}
                  {job.status === 'in_progress' && (
                    <Button size="sm" variant="secondary" onClick={() => changeJobStatus(job, 'completed')}>
                      {t.techMobile.completeJob}
                    </Button>
                  )}
                </div>
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
                <span>{activeEntryStart ? formatDateTime(activeEntryStart) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPS</span>
                <span>{gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.jobs.status}</span>
                <Badge variant={activeJobId ? 'success' : 'outline'}>
                  {activeJobId
                    ? <><CheckCircle className="h-3 w-3 mr-1" />{t.techMobile.onSite}</>
                    : t.techMobile.offSite}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
