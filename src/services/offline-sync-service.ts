import type { TimeEntry, Job } from '@/types'
import { loadStore, saveStore, STORE_KEYS } from '@/lib/data-store'
import { saveTimeEntry, saveEntity } from '@/services/entity-service'
import { uploadJobPhoto } from '@/services/storage-service'
import { base64ToFile } from '@/lib/file-utils'
import type { OfflineAction } from '@/lib/pwa'

export interface OfflineSyncContext {
  companyId: string
  employeeId?: string
  profileId?: string
}

interface LocalTimeEntry {
  id: string
  job_id: string
  start: string
  end?: string
  lat?: number
  lng?: number
}

function toTimeEntry(
  local: LocalTimeEntry,
  context: OfflineSyncContext,
  endOverride?: string
): TimeEntry {
  return {
    id: local.id,
    company_id: context.companyId,
    job_id: local.job_id,
    employee_id: context.employeeId,
    profile_id: context.profileId,
    start_time: local.start,
    end_time: endOverride ?? local.end,
    lat: local.lat,
    lng: local.lng,
    created_at: local.start,
  }
}

export async function applyOfflineAction(
  action: OfflineAction,
  context: OfflineSyncContext
): Promise<boolean> {
  if (action.type === 'clock_in') {
    const entry = action.payload as LocalTimeEntry
    const existing = loadStore<LocalTimeEntry>(STORE_KEYS.timeEntries)
    if (!existing.some((e) => e.id === entry.id)) {
      saveStore(STORE_KEYS.timeEntries, [entry, ...existing])
    }
    await saveTimeEntry(toTimeEntry(entry, context))
    return true
  }

  if (action.type === 'clock_out') {
    const { job_id, end } = action.payload as { job_id: string; end: string }
    const existing = loadStore<LocalTimeEntry>(STORE_KEYS.timeEntries)
    const next = existing.map((e) =>
      e.job_id === job_id && !e.end ? { ...e, end } : e
    )
    saveStore(STORE_KEYS.timeEntries, next)

    const closed = next.find((e) => e.job_id === job_id && e.end === end)
      ?? next.find((e) => e.job_id === job_id && e.end)
    if (closed) {
      await saveTimeEntry(toTimeEntry(closed, context, end))
    }
    return true
  }

  if (action.type === 'photo_upload') {
    const { companyId, jobId, fileName, mimeType, data } = action.payload as {
      companyId: string
      jobId: string
      fileName: string
      mimeType: string
      data: string
    }
    const file = base64ToFile(data, fileName, mimeType)
    await uploadJobPhoto(file, companyId, jobId)
    return true
  }

  if (action.type === 'update_job_status' || action.type === 'update_job') {
    const { job } = action.payload as { job: Job }
    await saveEntity('jobs', job)
    return true
  }

  return false
}
