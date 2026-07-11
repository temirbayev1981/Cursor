import { describe, it, expect } from 'vitest'
import { getErrorMessage, isVendorPOSaveError } from '@/lib/error-message'

describe('error-message', () => {
  it('reads message from Supabase-style error objects', () => {
    const error = {
      code: '42501',
      message: 'new row violates row-level security policy for table "vendor_po_records"',
      details: null,
      hint: null,
    }
    expect(getErrorMessage(error)).toBe(
      'new row violates row-level security policy for table "vendor_po_records"',
    )
    expect(isVendorPOSaveError(getErrorMessage(error))).toBe(true)
  })

  it('reads standard Error instances', () => {
    expect(getErrorMessage(new Error('PDF extract failed: worker'))).toBe('PDF extract failed: worker')
  })
})
