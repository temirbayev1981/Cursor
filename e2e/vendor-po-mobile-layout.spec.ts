import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Vendor PO mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_vendor_pos', '[]')
      localStorage.setItem('handymanos_vendor_pos_seeded', 'true')
      localStorage.setItem('__e2e_supabase__vendor_po_records', '[]')
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows card layout after PDF upload on small screens', async ({ page }) => {
    await page.goto('/work-orders')
    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-sample.pdf')
    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId(/^vendor-po-card-/).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })
})
