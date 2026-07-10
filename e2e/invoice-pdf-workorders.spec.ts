import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Invoice PDF export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('export PDF opens invoice preview with number and total', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByText('INV-2026-0141').first()).toBeVisible()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('invoice-export-pdf-inv-002').click()
    const popup = await popupPromise

    await expect(popup.locator('h1')).toContainText('INV-2026-0141')
    await expect(popup.locator('body')).toContainText('Mike & Lisa Chen')
    await expect(popup.locator('body')).toContainText('$4546.50')
    await popup.close()
  })

  test('invoice PDF preview includes line items and balance', async ({ page }) => {
    await page.goto('/invoices')
    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('invoice-export-pdf-inv-002').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Rental turnover/i)
    await expect(popup.locator('body')).toContainText(/Balance/i)
    await expect(popup.locator('body')).toContainText('$4546.50')
    await popup.close()
  })

  test('invoices summary shows outstanding total stat', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByTestId('invoices-summary-stats')).toBeVisible()
    await expect(page.getByText(/к оплате|outstanding/i).first()).toBeVisible()
    const outstanding = page.getByTestId('invoices-outstanding-total')
    await expect(outstanding).toBeVisible()
    await expect(outstanding).not.toHaveText('$0.00')
  })
})

test.describe('Work orders vendor PO batch UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('vendor PO tab shows dropzone and seeded record count', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /vendor po/i }).click()
    await expect(page.getByTestId('work-orders-vendor-po-dropzone')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('vendor-po-record-count')).toHaveText(/\d+/, { timeout: 15000 })
    const count = Number.parseInt(await page.getByTestId('vendor-po-record-count').textContent() ?? '0', 10)
    expect(count).toBeGreaterThanOrEqual(5)
    await expect(page.getByTestId('vendor-po-export-excel')).toBeVisible()
  })
})
