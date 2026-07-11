import type { VendorPORecord, VendorPOInput } from '@/types/vendor-po'
import { supabase } from '@/lib/supabase'
import { upsertRows } from '@/lib/supabase-queries'
import { getErrorMessage } from '@/lib/error-message'

const STORAGE_KEY = 'handymanos_vendor_pos'

function loadLocal(): VendorPORecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VendorPORecord[]) : []
  } catch {
    return []
  }
}

function saveLocal(records: VendorPORecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
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
    const updated = { ...duplicate, ...record, id: duplicate.id, created_at: duplicate.created_at }
    saveLocal(existing.map((row) => (row.id === duplicate.id ? updated : row)))
    return updated
  }
  const next = [record, ...existing]
  saveLocal(next)
  return record
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
  const payload = existing
    ? { ...record, id: existing.id, created_at: existing.created_at }
    : record

  const { data, error } = await upsertRows('vendor_po_records', payload, {
    onConflict: 'company_id,vendor_po_number',
  })
    .select()
    .maybeSingle()

  if (error) throw error
  if (data) return data as VendorPORecord

  const { data: fetched, error: fetchError } = await supabase!
    .from('vendor_po_records')
    .select('*')
    .eq('company_id', payload.company_id)
    .eq('vendor_po_number', payload.vendor_po_number)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (fetched) return fetched as VendorPORecord
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

  if (!supabase) {
    return saveLocalVendorPO(record)
  }

  try {
    const saved = await saveVendorPOToSupabase(record)
    saveLocalVendorPO(saved)
    return saved
  } catch (remoteError) {
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
