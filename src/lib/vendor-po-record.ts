import { extractProblemDescription } from '@/lib/vendor-po-parser'
import type { VendorPORecord } from '@/types/vendor-po'

/** Coerce nullable Supabase fields so table render never throws. */
export function normalizeVendorPORecord(row: VendorPORecord): VendorPORecord {
  const serviceDescription = row.service_description ?? ''
  const problemDescription = row.problem_description || extractProblemDescription(serviceDescription) || undefined

  return {
    ...row,
    problem_description: problemDescription,
    client_po_number: row.client_po_number ?? '',
    priority: row.priority ?? '',
    order_type: row.order_type ?? '',
    nte_amount: Number(row.nte_amount ?? 0),
    client_company: row.client_company ?? '',
    client_contact: row.client_contact ?? '',
    client_phone: row.client_phone ?? '',
    client_email: row.client_email ?? '',
    client_address: row.client_address ?? '',
    service_location_name: row.service_location_name ?? '',
    service_address: row.service_address ?? '',
    service_city: row.service_city ?? '',
    service_state: row.service_state ?? '',
    service_zip: row.service_zip ?? '',
    service_phone: row.service_phone ?? '',
    vendor_name: row.vendor_name ?? '',
    vendor_address: row.vendor_address ?? '',
    vendor_phone: row.vendor_phone ?? '',
    service_category: row.service_category ?? '',
    service_description: row.service_description ?? '',
    work_summary: row.work_summary ?? '',
    source_file_name: row.source_file_name ?? '',
    status: row.status ?? 'parsed',
    created_at: row.created_at ?? new Date().toISOString(),
  }
}

export function omitProblemDescriptionFields(
  record: VendorPORecord,
): Omit<VendorPORecord, 'problem_description' | 'problem_description_ru'> {
  const { problem_description: _en, problem_description_ru: _ru, ...rest } = record
  return rest
}

export function omitOptionalVendorPoFields(
  record: VendorPORecord,
): Omit<VendorPORecord, 'problem_description' | 'problem_description_ru' | 'source_file_hash'> {
  const { problem_description: _en, problem_description_ru: _ru, source_file_hash: _hash, ...rest } = record
  return rest
}

export function isMissingVendorPoColumnError(message: string): boolean {
  return /problem_description|source_file_hash|schema cache|could not find.*column/i.test(message)
}
