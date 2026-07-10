import { describe, it, expect, beforeEach } from 'vitest'

describe('e2e-mock-supabase upsert', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('upserts rows by composite conflict keys', async () => {
    localStorage.setItem('__e2e_db_seeded__', 'true')
    localStorage.setItem('__e2e_supabase__vendor_po_records', '[]')

    const { createE2eMockSupabase } = await import('./e2e-mock-supabase')
    const client = createE2eMockSupabase()

    const rowA = { id: 'a', company_id: 'comp-001', vendor_po_number: 'PO-1', title: 'first' }
    const rowB = { id: 'b', company_id: 'comp-001', vendor_po_number: 'PO-2', title: 'second' }

    await client.from('vendor_po_records').upsert([rowA, rowB] as never, { onConflict: 'company_id,vendor_po_number' })

    const { data: initial } = await client.from('vendor_po_records').select('*')
    expect((initial as unknown[]).length).toBe(2)

    await client.from('vendor_po_records').upsert(
      { id: 'c', company_id: 'comp-001', vendor_po_number: 'PO-1', title: 'updated' } as never,
      { onConflict: 'company_id,vendor_po_number' },
    )

    const { data: updated } = await client.from('vendor_po_records').select('*')
    const rows = updated as Array<{ id: string; vendor_po_number: string; title: string }>
    expect(rows.length).toBe(2)
    expect(rows.find((row) => row.vendor_po_number === 'PO-1')?.title).toBe('updated')
    expect(rows.find((row) => row.vendor_po_number === 'PO-2')?.title).toBe('second')
  })
})
