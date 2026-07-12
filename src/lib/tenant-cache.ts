import { STORE_KEYS } from '@/lib/data-store'

const VENDOR_PO_KEY = 'handymanos_vendor_pos'

/** Clears per-tenant entity caches from localStorage (not auth, locale, or offline queue). */
export function clearTenantEntityCache(): void {
  for (const key of Object.values(STORE_KEYS)) {
    localStorage.removeItem(key)
  }
  localStorage.removeItem(VENDOR_PO_KEY)
}
