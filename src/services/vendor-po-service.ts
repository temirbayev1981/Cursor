import type { VendorPORecord, VendorPOInput } from '@/types/vendor-po'
import { supabase } from '@/lib/supabase'
import { insertRows, upsertRows } from '@/lib/supabase-queries'
import { getErrorMessage } from '@/lib/error-message'

const STORAGE_KEY = 'handymanos_vendor_pos'

export class VendorPoDuplicateError extends Error {
  readonly vendorPoNumber: string

  constructor(vendorPoNumber: string) {
    super(`Vendor PO ${vendorPoNumber} already exists`)
    this.name = 'VendorPoDuplicateError'
    this.vendorPoNumber = vendorPoNumber
  }
}

export function isVendorPoDuplicateError(error: unknown): error is VendorPoDuplicateError {
  return error instanceof VendorPoDuplicateError
}

function loadLocal(): VendorPORecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VendorPORecord[]) : []
  } catch {
    return []
  }
}

function saveLocal(records: VendorPORecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (err) {
    const trimmed = records.map((record) => ({
      ...record,
      service_description: record.service_description?.slice(0, 1000),
      special_instructions: record.special_instructions?.slice(0, 300),
      work_summary: record.work_summary?.slice(0, 500),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    console.warn('Vendor PO local cache trimmed:', getErrorMessage(err))
  }
}

function toRecord(input: VendorPOInput): VendorPORecord {
  return {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? 'parsed',
    created_at: new Date().toISOString(),
  }
}

function mergeVendorPOLists(remote: VendorPORecord[], local: VendorPORecord[], companyId: string): VendorPORecord[] {
  const byKey = new Map<string, VendorPORecord>()
  for (const record of local.filter((row) => row.company_id === companyId)) {
    byKey.set(record.vendor_po_number, record)
  }
  for (const record of remote) {
    byKey.set(record.vendor_po_number, record)
  }
  return [...byKey.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

function saveLocalVendorPO(record: VendorPORecord): VendorPORecord {
  const existing = loadLocal()
  const duplicate = existing.find(
    (row) => row.vendor_po_number === record.vendor_po_number && row.company_id === record.company_id,
  )
  if (duplicate) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }
  const next = [record, ...existing]
  saveLocal(next)
  return record
}

export async function vendorPoNumberExists(companyId: string, vendorPoNumber: string): Promise<boolean> {
  if (loadLocal().some((row) => row.company_id === companyId && row.vendor_po_number === vendorPoNumber)) {
    return true
  }
  if (!supabase) return false
  const existing = await findExistingVendorPO({
    company_id: companyId,
    vendor_po_number: vendorPoNumber,
  } as VendorPORecord)
  return existing !== null
}

export async function getExistingVendorPoNumbers(companyId: string): Promise<Set<string>> {
  const numbers = new Set(
    loadLocal()
      .filter((row) => row.company_id === companyId)
      .map((row) => row.vendor_po_number),
  )
  if (!supabase) return numbers

  const { data, error } = await supabase
    .from('vendor_po_records')
    .select('vendor_po_number')
    .eq('company_id', companyId)

  if (error) {
    console.error('Vendor PO duplicate lookup failed:', getErrorMessage(error))
    return numbers
  }

  for (const row of (data ?? []) as Array<{ vendor_po_number: string | null }>) {
    if (row.vendor_po_number) numbers.add(row.vendor_po_number)
  }
  return numbers
}

async function findExistingVendorPO(record: VendorPORecord): Promise<Pick<VendorPORecord, 'id' | 'created_at'> | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('vendor_po_records')
    .select('id, created_at')
    .eq('company_id', record.company_id)
    .eq('vendor_po_number', record.vendor_po_number)
    .maybeSingle()
  if (error) throw error
  return data as Pick<VendorPORecord, 'id' | 'created_at'> | null
}

async function saveVendorPOToSupabase(record: VendorPORecord): Promise<VendorPORecord> {
  const existing = await findExistingVendorPO(record)
  if (existing) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }

  const { data, error } = await insertRows('vendor_po_records', record as never)
    .select()
    .maybeSingle()

  if (error) {
    if (/duplicate key|23505|already exists/i.test(getErrorMessage(error))) {
      throw new VendorPoDuplicateError(record.vendor_po_number)
    }
    throw error
  }
  if (data) return data as VendorPORecord
  throw new Error('vendor_po save succeeded but row was not returned')
}

export async function getVendorPOs(companyId: string): Promise<VendorPORecord[]> {
  const local = loadLocal().filter((row) => row.company_id === companyId)

  if (!supabase) {
    return local.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  const { data, error } = await supabase
    .from('vendor_po_records')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Vendor PO remote load failed:', getErrorMessage(error))
    return local.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  return mergeVendorPOLists((data ?? []) as VendorPORecord[], local, companyId)
}

export async function saveVendorPO(input: VendorPOInput): Promise<VendorPORecord> {
  const record = toRecord(input)

  if (await vendorPoNumberExists(record.company_id, record.vendor_po_number)) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }

  if (!supabase) {
    return saveLocalVendorPO(record)
  }

  try {
    const saved = await saveVendorPOToSupabase(record)
    saveLocalVendorPO(saved)
    return saved
  } catch (remoteError) {
    if (isVendorPoDuplicateError(remoteError)) throw remoteError
    console.error('Vendor PO Supabase save failed:', getErrorMessage(remoteError))
    return saveLocalVendorPO(record)
  }
}

export async function saveVendorPOBatch(inputs: VendorPOInput[]): Promise<VendorPORecord[]> {
  const saved: VendorPORecord[] = []
  for (const input of inputs) {
    saved.push(await saveVendorPO(input))
  }
  return saved
}

export async function deleteVendorPO(id: string): Promise<void> {
  saveLocal(loadLocal().filter((row) => row.id !== id))

  if (!supabase) {
    return
  }

  const { error } = await supabase.from('vendor_po_records').delete().eq('id', id)
  if (error) throw error
}

export async function seedVendorPOs(records: VendorPORecord[]): Promise<void> {
  if (!supabase) {
    const existing = loadLocal()
    const merged = [...records]
    for (const item of existing) {
      if (!merged.some((row) => row.vendor_po_number === item.vendor_po_number)) {
        merged.push(item)
      }
    }
    saveLocal(merged)
    return
  }

  const { error } = await upsertRows('vendor_po_records', records, {
    onConflict: 'company_id,vendor_po_number',
  })
  if (error) throw error
}
