import type { VendorPORecord } from '@/types/vendor-po'

export function groupVendorPOsByAddress(records: VendorPORecord[]): Map<string, VendorPORecord[]> {
  const groups = new Map<string, VendorPORecord[]>()
  for (const r of records) {
    const key = `${r.service_address}, ${r.service_city}, ${r.service_state}`
    const list = groups.get(key) ?? []
    list.push(r)
    groups.set(key, list)
  }
  return groups
}
