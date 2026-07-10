import { test, expect } from '@playwright/test'
import { loginAsOwner, seedBulkDraftJobs, seedPortalCustomerInvoice } from './helpers/auth'

test.describe('Report PDF i18n', () => {
  test('Russian locale uses Russian PDF labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Выручка/i)
    await expect(popup.locator('body')).toContainText(/Выручка по месяцам/i)
    await expect(popup.locator('body')).toContainText(/Месяц/i)
    await popup.close()
  })

  test('English locale uses English PDF labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Revenue/i)
    await expect(popup.locator('body')).toContainText(/Revenue by month/i)
    await expect(popup.locator('body')).toContainText(/Month/i)
    await popup.close()
  })
})

test.describe('Jobs bulk technician assign', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedBulkDraftJobs(page)
  })

  test('bulk assign sets technician on selected draft jobs', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()

    await page.getByTestId('job-select-job-bulk-001').check()
    await page.getByTestId('job-select-job-bulk-002').check()

    await page.getByTestId('jobs-bulk-technician').click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await page.getByTestId('jobs-bulk-assign').click()

    await expect(page.getByText(/назначено мастеров:\s*2|assigned technician to 2 jobs/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('job-technician-job-bulk-001')).toContainText('Marcus Thompson')
    await expect(page.getByTestId('job-technician-job-bulk-002')).toContainText('Marcus Thompson')
  })
})

test.describe('Customer portal invoice pay', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('handymanos_portal_token', 'demo')
    })
  })

  test('demo pay button records portal invoice payment', async ({ page }) => {
    await page.goto('/portal/customer')
    await seedPortalCustomerInvoice(page)
    await expect(page.getByText('INV-PORTAL-E2E').first()).toBeVisible()

    await page.getByTestId('invoice-pay-inv-portal-e2e').click()
    await expect(page.getByTestId('invoice-pay-inv-portal-e2e')).not.toBeVisible({ timeout: 15000 })
  })
})
