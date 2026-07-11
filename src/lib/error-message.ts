/** Normalize thrown values (Supabase PostgrestError, Error, strings) into a message. */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (!error) return fallback
  if (typeof error === 'string') return error || fallback
  if (error instanceof Error) return error.message || fallback
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string' && record.message) return record.message
    if (typeof record.error_description === 'string' && record.error_description) return record.error_description
    if (typeof record.details === 'string' && record.details) return record.details
    try {
      return JSON.stringify(error)
    } catch {
      return fallback
    }
  }
  return String(error) || fallback
}

export function isVendorPOSaveError(message: string): boolean {
  return /vendor_po|permission|policy|violates|uuid|company_id|supabase not configured|load failed|network|fetch|jwt|auth|timeout|aborted|postgrest|row-level security|pgrst|duplicate key|does not exist|42P01|42501|23505/i.test(
    message,
  )
}

export function isPdfExtractError(message: string): boolean {
  return /PDF extract failed|PDF OCR failed|worker|Invalid PDF|pdf\.js|fake worker|Failed to fetch|\.mjs|Canvas|password protected|corrupted|api version|module script|importing a module|couldn't be opened|could not be opened|arraybuffer|FileReader|chunk|dynamically imported|Loading CSS/i.test(
    message,
  )
}

export function isVendorPOStorageError(message: string): boolean {
  return /quota|storage|QuotaExceeded/i.test(message)
}
