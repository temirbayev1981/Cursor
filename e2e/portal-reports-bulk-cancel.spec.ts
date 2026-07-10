import { test, expect } from '@playwright/test'
import { loginAsOwner, seedBulkDraftJobs } from './helpers/auth'

test.describe('Property portal English', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('handymanos_portal_token', 'demo')
      localStorage.setItem('handymanos_locale', 'en')
    })
  })

  test('property portal shows English heading and submit request form', async ({ page }) => {
    await page.goto('/portal/property')
    await expect(page.getByRole('heading', { name: 'Property manager portal' })).toBeVisible()
    await expect(page.getByText('ABC Property Management')).toBeVisible()

    await page.getByTestId('property-portal-submit-request').click()
    await expect(page.getByTestId('property-portal-request-form')).toBeVisible()
    await page.getByTestId('property-portal-request-form').locator('input').first().fill('Roof inspection - building B')
    await page.getByTestId('property-portal-request-form').locator('textarea').first().fill('Annual roof inspection and minor repair assessment')
    await page.getByTestId('property-portal-request-submit').click()

    await expect(page.getByText(/request submitted/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Roof inspection - building B')).toBeVisible()
  })
})

test.describe('Report PDF technicians tab', () => {
  test('Russian locale exports technician performance labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-technicians').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Эффективность мастеров/i)
    await expect(popup.locator('body')).toContainText(/Эффективность/i)
    await popup.close()
  })

  test('English locale exports technician performance labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-technicians').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Technician Performance/i)
    await expect(popup.locator('body')).toContainText(/Efficiency/i)
    await popup.close()
  })
})

test.describe('Jobs bulk cancel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedBulkDraftJobs(page)
  })

  test('bulk cancel marks selected draft jobs as cancelled', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()

    await page.getByTestId('job-select-job-bulk-001').check()
    await page.getByTestId('job-select-job-bulk-002').check()
    await page.getByTestId('jobs-bulk-cancel').click()

    await expect(page.getByText(/отменено заказов:\s*2|cancelled 2 jobs/i).first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('tab', { name: /все|all/i }).click()
    await expect(page.getByText('E2E Bulk Draft A').first()).toBeVisible()
    await expect(page.getByText('E2E Bulk Draft B').first()).toBeVisible()
    await expect(page.getByText(/отменён|cancelled/i).first()).toBeVisible()
  })
})
