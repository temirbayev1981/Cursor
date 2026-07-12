import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Vendor PO null-safe render', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const broken = [{
        id: 'vpo-null-priority',
        company_id: 'comp-001',
        vendor_po_number: '999999-01',
        client_po_number: null,
        priority: null,
        order_type: null,
        nte_amount: 115,
        service_location_name: 'Test Store',
        service_address: '1 Main St',
        service_city: 'Raleigh',
        service_state: 'NC',
        work_summary: null,
        service_description: 'BUILDING repair',
        source_file_name: 'broken.pdf',
        status: 'parsed',
        created_at: '2026-07-10T12:00:00Z',
      }]
      localStorage.setItem('handymanos_vendor_pos', JSON.stringify(broken))
      localStorage.setItem('handymanos_vendor_pos_seeded', 'true')
      localStorage.setItem('__e2e_supabase__vendor_po_records', JSON.stringify(broken))
    })
    await loginAsOwner(page, 'ru')
  })

  test('table renders records with null priority without crashing', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto('/work-orders')
    await expect(visibleText(page, '999999-01', true).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(pageErrors).toEqual([])
  })
})
