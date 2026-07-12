import { test, expect, devices } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleText } from './helpers/visibility'

const iPhone13 = devices['iPhone 13']

test.use({
  viewport: iPhone13.viewport,
  userAgent: iPhone13.userAgent,
  deviceScaleFactor: iPhone13.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
})

test.describe('Mobile vendor PO PDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_vendor_pos', '[]')
      localStorage.setItem('handymanos_vendor_pos_seeded', 'true')
      localStorage.setItem('__e2e_supabase__vendor_po_records', '[]')
    })
    await loginAsOwner(page, 'ru')
  })

  test('iPhone viewport parses Facil-IT PDF 210072-01 on work-orders page', async ({ page }) => {
    await page.goto('/work-orders')

    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-210072-01.pdf')

    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 30000 })
    await expect(visibleText(page, '210072-01', true).first()).toBeVisible()
    await expect(visibleText(page, '355708360', true).first()).toBeVisible()
  })
})
