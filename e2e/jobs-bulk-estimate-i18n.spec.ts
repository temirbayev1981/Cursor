import { test, expect } from '@playwright/test'
import { loginAsOwner, seedBulkDraftJobs } from './helpers/auth'
import { expectJobTitleVisible, visibleTestId } from './helpers/visibility'

test.describe('Estimate PDF i18n', () => {
  test('Russian locale uses Russian PDF labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/estimates')

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('estimate-export-pdf-est-001').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Труд/i)
    await expect(popup.locator('body')).toContainText(/Материалы/i)
    await expect(popup.locator('body')).toContainText(/Позиции/i)
    await expect(popup.locator('body')).toContainText(/Действует до/i)
    await popup.close()
  })

  test('English locale uses English PDF labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/estimates')

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('estimate-export-pdf-est-001').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Labor/i)
    await expect(popup.locator('body')).toContainText(/Materials/i)
    await expect(popup.locator('body')).toContainText(/Line items/i)
    await expect(popup.locator('body')).toContainText(/Valid Until/i)
    await popup.close()
  })
})

test.describe('Jobs bulk actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedBulkDraftJobs(page)
  })

  test('bulk bar updates selected draft jobs to scheduled', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()

    await visibleTestId(page, 'job-select-job-bulk-001').check()
    await visibleTestId(page, 'job-select-job-bulk-002').check()
    await expect(page.getByTestId('jobs-bulk-bar')).toBeVisible()
    await expect(page.getByTestId('jobs-bulk-bar')).toContainText(/выбрано:\s*2|selected:\s*2/i)

    await page.getByTestId('jobs-bulk-status').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await page.getByTestId('jobs-bulk-apply').click()

    await expect(page.getByText(/обновлено заказов:\s*2|updated 2 jobs/i).first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('tab', { name: /запланирован|scheduled/i }).click()
    await expectJobTitleVisible(page, 'E2E Bulk Draft A')
    await expectJobTitleVisible(page, 'E2E Bulk Draft B')
  })

  test('select all checkbox selects visible filtered jobs', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()
    await expectJobTitleVisible(page, 'E2E Bulk Draft A')

    await page.getByTestId('jobs-select-all').check()
    await expect(page.getByTestId('jobs-bulk-bar')).toContainText(/выбрано:\s*2|selected:\s*2/i)

    await page.getByTestId('jobs-select-all').uncheck()
    await expect(page.getByTestId('jobs-bulk-bar')).not.toBeVisible()
  })

  test('bulk schedule assigns technician and moves jobs to scheduled', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()

    await visibleTestId(page, 'job-select-job-bulk-001').check()
    await visibleTestId(page, 'job-select-job-bulk-002').check()
    await page.getByTestId('jobs-bulk-schedule').click()

    await expect(page.getByText(/запланировано заказов:\s*2|scheduled 2 jobs/i).first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('tab', { name: /запланирован|scheduled/i }).click()
    await expectJobTitleVisible(page, 'E2E Bulk Draft A')
    await expectJobTitleVisible(page, 'E2E Bulk Draft B')
    await expect(page.getByTestId('job-technician-job-bulk-001').locator('visible=true')).toContainText('Marcus Thompson')
    await expect(page.getByTestId('job-technician-job-bulk-002').locator('visible=true')).toContainText('Marcus Thompson')
  })
})
