import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Vendor PO 210071 upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_vendor_pos', '[]')
      localStorage.setItem('handymanos_vendor_pos_seeded', 'true')
      localStorage.setItem('__e2e_supabase__vendor_po_records', '[]')
    })
    await loginAsOwner(page, 'ru')
  })

  test('upload 210071 PDF does not crash page', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto('/work-orders')

    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-210071-01.pdf')

    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('210071-01').first()).toBeVisible()
    await expect(page.getByTestId(/vendor-po-problem-/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(pageErrors).toEqual([])
  })
})
