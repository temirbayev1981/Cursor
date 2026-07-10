import type { VendorPORecord, VendorPOInput } from '@/types/vendor-po'
import { supabase, DEMO_MODE } from '@/lib/supabase'

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

export async function getVendorPOs(companyId: string): Promise<VendorPORecord[]> {
  if (DEMO_MODE || !supabase) {
    return loadLocal()
      .filter((r) => r.company_id === companyId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  const { data, error } = await supabase
    .from('vendor_po_records')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as VendorPORecord[]
}

export async function saveVendorPO(input: VendorPOInput): Promise<VendorPORecord> {
  const record = toRecord(input)

  if (DEMO_MODE || !supabase) {
    const existing = loadLocal()
    const duplicate = existing.find(
      (r) => r.vendor_po_number === record.vendor_po_number && r.company_id === record.company_id
    )
    if (duplicate) {
      const updated = { ...duplicate, ...record, id: duplicate.id, created_at: duplicate.created_at }
      saveLocal(existing.map((r) => (r.id === duplicate.id ? updated : r)))
      return updated
    }
    const next = [record, ...existing]
    saveLocal(next)
    return record
  }

  const { data, error } = await supabase
    .from('vendor_po_records')
    .upsert(record as never, { onConflict: 'company_id,vendor_po_number' })
    .select()
    .single()

  if (error) throw error
  return data as VendorPORecord
}

export async function saveVendorPOBatch(inputs: VendorPOInput[]): Promise<VendorPORecord[]> {
  const saved: VendorPORecord[] = []
  for (const input of inputs) {
    saved.push(await saveVendorPO(input))
  }
  return saved
}

export async function deleteVendorPO(id: string): Promise<void> {
  if (DEMO_MODE || !supabase) {
    saveLocal(loadLocal().filter((r) => r.id !== id))
    return
  }

  const { error } = await supabase.from('vendor_po_records').delete().eq('id', id)
  if (error) throw error
}

export async function seedVendorPOs(records: VendorPORecord[]): Promise<void> {
  if (DEMO_MODE || !supabase) {
    const existing = loadLocal()
    const merged = [...records]
    for (const item of existing) {
      if (!merged.some((m) => m.vendor_po_number === item.vendor_po_number)) {
        merged.push(item)
      }
    }
    saveLocal(merged)
    return
  }

  const { error } = await supabase.from('vendor_po_records').upsert(records as never, {
    onConflict: 'company_id,vendor_po_number',
  })
  if (error) throw error
}
