import type { JobPhoto } from '@/types'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { loadStore, upsertStore, STORE_KEYS } from '@/lib/data-store'

const BUCKET = 'handymanos'

export async function uploadJobPhoto(
  file: File,
  companyId: string,
  jobId: string,
  caption?: string
): Promise<JobPhoto> {
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${companyId}/jobs/${jobId}/${id}.${ext}`

  let url: string

  if (DEMO_MODE || !supabase) {
    url = URL.createObjectURL(file)
  } else {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    url = data.publicUrl
  }

  const photo: JobPhoto = {
    id,
    company_id: companyId,
    job_id: jobId,
    url,
    caption,
    created_at: new Date().toISOString(),
  }

  upsertStore(STORE_KEYS.photos, photo)

  if (!DEMO_MODE && supabase) {
    await supabase.from('photos').insert({
      id: photo.id,
      company_id: companyId,
      job_id: jobId,
      url: photo.url,
      caption: caption ?? null,
    } as never)
  }

  return photo
}

export async function uploadDocument(
  file: File,
  companyId: string,
  entityType: string,
  entityId: string
): Promise<{ id: string; url: string; name: string }> {
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${companyId}/documents/${entityType}/${entityId}/${id}.${ext}`

  let url: string

  if (DEMO_MODE || !supabase) {
    url = URL.createObjectURL(file)
  } else {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    url = data.publicUrl
  }

  const doc = {
    id,
    company_id: companyId,
    entity_type: entityType,
    entity_id: entityId,
    name: file.name,
    file_url: url,
    file_type: file.type,
    created_at: new Date().toISOString(),
  }

  if (!DEMO_MODE && supabase) {
    await supabase.from('documents').insert(doc as never)
  }

  return { id, url, name: file.name }
}

export function listJobPhotos(jobId: string): JobPhoto[] {
  return loadStore<JobPhoto>(STORE_KEYS.photos).filter((p) => p.job_id === jobId)
}
