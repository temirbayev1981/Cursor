import type { JobPhoto } from '@/types'
import { supabase } from '@/lib/supabase'
import { insertRows } from '@/lib/supabase-queries'
import { loadStore, upsertStore, STORE_KEYS } from '@/lib/data-store'

const BUCKET = 'handymanos'
const SIGNED_URL_TTL = 60 * 60 * 24 * 7

async function resolveStorageUrl(stored: string): Promise<string> {
  if (!supabase || stored.startsWith('blob:') || stored.startsWith('http')) {
    return stored
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(stored, SIGNED_URL_TTL)
  if (error || !data?.signedUrl) return stored
  return data.signedUrl
}

export async function uploadJobPhoto(
  file: File,
  companyId: string,
  jobId: string,
  caption?: string
): Promise<JobPhoto> {
  if (!supabase) throw new Error('Supabase not configured')

  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${companyId}/jobs/${jobId}/${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError
  const url = await resolveStorageUrl(path)

  const photo: JobPhoto = {
    id,
    company_id: companyId,
    job_id: jobId,
    url,
    caption,
    created_at: new Date().toISOString(),
  }

  upsertStore(STORE_KEYS.photos, { ...photo, url: path })

  await insertRows('photos', {
    id: photo.id,
    company_id: companyId,
    job_id: jobId,
    url: path,
    caption: caption ?? null,
  })

  return { ...photo, url }
}

export async function uploadDocument(
  file: File,
  companyId: string,
  entityType: string,
  entityId: string
): Promise<{ id: string; url: string; name: string }> {
  if (!supabase) throw new Error('Supabase not configured')

  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${companyId}/documents/${entityType}/${entityId}/${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError
  const url = await resolveStorageUrl(path)

  const doc = {
    id,
    company_id: companyId,
    entity_type: entityType,
    entity_id: entityId,
    name: file.name,
    file_url: path,
    file_type: file.type,
    created_at: new Date().toISOString(),
  }

  await insertRows('documents', doc)

  return { id, url, name: file.name }
}

export async function listJobPhotos(jobId: string): Promise<JobPhoto[]> {
  const photos = loadStore<JobPhoto>(STORE_KEYS.photos).filter((p) => p.job_id === jobId)
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      url: await resolveStorageUrl(photo.url),
    })),
  )
}
