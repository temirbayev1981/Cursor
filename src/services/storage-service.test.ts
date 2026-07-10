import { describe, it, expect, beforeEach } from 'vitest'
import { uploadJobPhoto, listJobPhotos } from './storage-service'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { base64ToFile } from '@/lib/file-utils'

describe('storage-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uploadJobPhoto stores photo and listJobPhotos returns signed url', async () => {
    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const file = base64ToFile(tinyPng, 'field.jpg', 'image/jpeg')

    const photo = await uploadJobPhoto(file, 'comp-001', 'job-001', 'Field photo')
    expect(photo.job_id).toBe('job-001')
    expect(photo.company_id).toBe('comp-001')
    expect(photo.caption).toBe('Field photo')

    const stored = loadStore<{ id: string }>(STORE_KEYS.photos)
    expect(stored.some((p) => p.id === photo.id)).toBe(true)

    const listed = await listJobPhotos('job-001')
    expect(listed).toHaveLength(1)
    expect(listed[0].id).toBe(photo.id)
    expect(listed[0].url).toMatch(/^https:\/\/e2e\.local\//)
  })
})
