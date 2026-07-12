import type { VendorPORecord, VendorPOInput } from '@/types/vendor-po'
import { supabase } from '@/lib/supabase'
import { insertRows, updateRows, upsertRows } from '@/lib/supabase-queries'
import { getErrorMessage } from '@/lib/error-message'
import { normalizeVendorPoFileName } from '@/lib/vendor-po-upload'
import {
  VendorPoDuplicateError,
  VendorPoDuplicateFileError,
  isVendorPoDuplicateError,
  isVendorPoDuplicateFileError,
} from '@/lib/vendor-po-errors'
import {
  normalizeVendorPORecord,
  omitOptionalVendorPoFields,
  omitProblemDescriptionFields,
  isMissingVendorPoColumnError,
} from '@/lib/vendor-po-record'
import { withTimeout } from '@/lib/with-timeout'

const SUPABASE_OP_TIMEOUT_MS = 15_000

type SupabaseResult<T> = { data: T | null; error: unknown }

function supabaseOp<T>(builder: PromiseLike<SupabaseResult<T>>, label: string): Promise<SupabaseResult<T>> {
  return withTimeout(Promise.resolve(builder), SUPABASE_OP_TIMEOUT_MS, label)
}

export {
  VendorPoDuplicateError,
  VendorPoDuplicateFileError,
  isVendorPoDuplicateError,
  isVendorPoDuplicateFileError,
} from '@/lib/vendor-po-errors'

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (err) {
    const trimmed = records.map((record) => ({
      ...record,
      service_description: record.service_description?.slice(0, 1000),
      special_instructions: record.special_instructions?.slice(0, 300),
      work_summary: record.work_summary?.slice(0, 500),
      problem_description: record.problem_description?.slice(0, 500),
      problem_description_ru: record.problem_description_ru?.slice(0, 500),
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch (trimErr) {
      console.warn('Vendor PO local cache save failed:', getErrorMessage(trimErr))
      throw trimErr
    }
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
  const duplicatePo = existing.find(
    (row) => row.vendor_po_number === record.vendor_po_number && row.company_id === record.company_id,
  )
  if (duplicatePo) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }
  const duplicateFile = existing.find((row) => row.company_id === record.company_id && isSameUploadedPdf(row, record))
  if (duplicateFile) {
    throw new VendorPoDuplicateFileError(record.source_file_name)
  }
  const next = [record, ...existing]
  saveLocal(next)
  return record
}

function isSameUploadedPdf(a: VendorPORecord, b: VendorPORecord): boolean {
  if (a.source_file_hash && b.source_file_hash && a.source_file_hash === b.source_file_hash) return true
  return normalizeVendorPoFileName(a.source_file_name) === normalizeVendorPoFileName(b.source_file_name)
}

export async function vendorPdfFileExists(
  companyId: string,
  fileName: string,
  fileHash?: string,
): Promise<boolean> {
  const companyRows = loadLocal().filter((row) => row.company_id === companyId)
  const normalized = normalizeVendorPoFileName(fileName)
  if (companyRows.some((row) => normalizeVendorPoFileName(row.source_file_name) === normalized)) {
    return true
  }
  if (fileHash && companyRows.some((row) => row.source_file_hash === fileHash)) {
    return true
  }
  if (!supabase) return false

  try {
    if (fileHash) {
      const { data, error } = await supabaseOp(
        supabase
          .from('vendor_po_records')
          .select('id')
          .eq('company_id', companyId)
          .eq('source_file_hash', fileHash)
          .limit(1)
          .maybeSingle(),
        'vendor PO hash lookup',
      )
      if (!error && data) return true
      if (error && !isMissingVendorPoColumnError(getErrorMessage(error))) {
        console.error('Vendor PO hash duplicate lookup failed:', getErrorMessage(error))
      }
    }

    const { data, error } = await supabaseOp<{ source_file_name: string | null }>(
      supabase
        .from('vendor_po_records')
        .select('source_file_name')
        .eq('company_id', companyId)
        .ilike('source_file_name', fileName)
        .limit(1)
        .maybeSingle(),
      'vendor PO filename lookup',
    )
    if (!error && data?.source_file_name && normalizeVendorPoFileName(data.source_file_name) === normalized) {
      return true
    }

    if (error) {
      console.error('Vendor PO file duplicate lookup failed:', getErrorMessage(error))
    }
  } catch (err) {
    console.error('Vendor PO file duplicate lookup failed:', getErrorMessage(err))
  }
  return false
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
  const { data, error } = await supabaseOp(
    supabase
      .from('vendor_po_records')
      .select('id, created_at')
      .eq('company_id', record.company_id)
      .eq('vendor_po_number', record.vendor_po_number)
      .maybeSingle(),
    'vendor PO lookup',
  )
  if (error) throw error
  return data as Pick<VendorPORecord, 'id' | 'created_at'> | null
}

async function saveVendorPOToSupabase(record: VendorPORecord): Promise<VendorPORecord> {
  const existing = await findExistingVendorPO(record)
  if (existing) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }

  const payloads = [
    record,
    omitProblemDescriptionFields(record),
    omitOptionalVendorPoFields(record),
  ]

  let lastError: unknown
  for (const payload of payloads) {
    const { data, error } = await supabaseOp<VendorPORecord>(
      insertRows('vendor_po_records', payload as never)
        .select()
        .maybeSingle(),
      'vendor PO save',
    )

    if (!error && data) return normalizeVendorPORecord(data as VendorPORecord)

    lastError = error
    const message = getErrorMessage(error)
    if (!isMissingVendorPoColumnError(message)) break
  }

  const message = getErrorMessage(lastError)
  if (/duplicate key|23505|already exists/i.test(message)) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }
  throw lastError
}

export async function getVendorPOs(companyId: string): Promise<VendorPORecord[]> {
  const local = loadLocal()
    .filter((row) => row.company_id === companyId)
    .map(normalizeVendorPORecord)

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

  const remote = ((data ?? []) as VendorPORecord[]).map(normalizeVendorPORecord)
  return mergeVendorPOLists(remote, local, companyId)
}

export async function saveVendorPO(input: VendorPOInput): Promise<VendorPORecord> {
  const record = toRecord(input)

  if (await withTimeout(vendorPoNumberExists(record.company_id, record.vendor_po_number), SUPABASE_OP_TIMEOUT_MS, 'vendor PO duplicate check')) {
    throw new VendorPoDuplicateError(record.vendor_po_number)
  }
  if (await withTimeout(vendorPdfFileExists(record.company_id, record.source_file_name, record.source_file_hash), SUPABASE_OP_TIMEOUT_MS, 'vendor PO file duplicate check')) {
    throw new VendorPoDuplicateFileError(record.source_file_name)
  }

  if (!supabase) {
    return normalizeVendorPORecord(saveLocalVendorPO(record))
  }

  try {
    const saved = await saveVendorPOToSupabase(record)
    try {
      saveLocalVendorPO(saved)
    } catch (localError) {
      console.warn('Vendor PO local cache after remote save failed:', getErrorMessage(localError))
    }
    return saved
  } catch (remoteError) {
    if (isVendorPoDuplicateError(remoteError) || isVendorPoDuplicateFileError(remoteError)) throw remoteError
    console.error('Vendor PO Supabase save failed:', getErrorMessage(remoteError))
    return normalizeVendorPORecord(saveLocalVendorPO(record))
  }
}

export async function saveVendorPOBatch(inputs: VendorPOInput[]): Promise<VendorPORecord[]> {
  const saved: VendorPORecord[] = []
  for (const input of inputs) {
    saved.push(await saveVendorPO(input))
  }
  return saved
}

export type VendorPOStatusLookup = {
  company_id: string
  vendor_po_number: string
}

export async function updateVendorPOStatus(
  id: string,
  status: VendorPORecord['status'],
  lookup?: VendorPOStatusLookup,
): Promise<void> {
  const local = loadLocal()
  let index = local.findIndex((row) => row.id === id)
  if (index < 0 && lookup) {
    index = local.findIndex(
      (row) => row.company_id === lookup.company_id && row.vendor_po_number === lookup.vendor_po_number,
    )
  }
  if (index >= 0) {
    local[index] = { ...local[index], status }
    saveLocal(local)
  }

  if (!supabase) return

  const { error } = await supabaseOp(
    updateRows('vendor_po_records', { status }, 'id', id),
    'vendor PO status update',
  )
  if (!error) return

  if (lookup) {
    const { error: fallbackError } = await supabaseOp(
      supabase
        .from('vendor_po_records')
        .update({ status } as never)
        .eq('company_id', lookup.company_id)
        .eq('vendor_po_number', lookup.vendor_po_number),
      'vendor PO status update by number',
    )
    if (!fallbackError) return
    console.error('Vendor PO status update by number failed:', getErrorMessage(fallbackError))
  }

  console.error('Vendor PO status update failed:', getErrorMessage(error))
  throw error
}

export async function updateVendorPOProblemRu(id: string, problemDescriptionRu: string): Promise<void> {
  const trimmed = problemDescriptionRu.trim().slice(0, 500)
  if (!trimmed) return

  const local = loadLocal()
  const index = local.findIndex((row) => row.id === id)
  if (index >= 0) {
    local[index] = { ...local[index], problem_description_ru: trimmed }
    saveLocal(local)
  }

  if (!supabase) return

  const { error } = await supabaseOp(
    updateRows('vendor_po_records', { problem_description_ru: trimmed }, 'id', id),
    'vendor PO problem ru update',
  )
  if (error) {
    console.error('Vendor PO problem description ru update failed:', getErrorMessage(error))
  }
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
