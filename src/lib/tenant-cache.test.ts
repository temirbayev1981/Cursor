import { describe, it, expect, beforeEach } from 'vitest'
import { clearTenantEntityCache } from './tenant-cache'
import { STORE_KEYS } from '@/lib/data-store'

describe('tenant-cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes entity store keys and vendor PO cache', () => {
    localStorage.setItem(STORE_KEYS.jobs, '[]')
    localStorage.setItem(STORE_KEYS.customers, '[]')
    localStorage.setItem('handymanos_vendor_pos', '[]')
    localStorage.setItem('handymanos_locale', 'ru')
    localStorage.setItem('handymanos_auth', 'true')

    clearTenantEntityCache()

    expect(localStorage.getItem(STORE_KEYS.jobs)).toBeNull()
    expect(localStorage.getItem(STORE_KEYS.customers)).toBeNull()
    expect(localStorage.getItem('handymanos_vendor_pos')).toBeNull()
    expect(localStorage.getItem('handymanos_locale')).toBe('ru')
    expect(localStorage.getItem('handymanos_auth')).toBe('true')
  })
})
