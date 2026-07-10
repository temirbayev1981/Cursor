import { test, expect } from '@playwright/test'
import { loginAsOwner, clearPortalReview, resetEstimateStatus, seedBulkDraftJobs, seedOnHoldJob, seedPortalCustomerInvoice, setPropertyPortalSession, setCustomerPortalSession } from './helpers/auth'

test.describe('Property portal English', () => {
  test.beforeEach(async ({ page }) => {
    await setPropertyPortalSession(page)
    await page.addInitScript(() => {
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
    await page.getByTestId('jobs-tab-cancelled').click()
    await expect(page.getByText('E2E Bulk Draft A').first()).toBeVisible()
    await expect(page.getByText('E2E Bulk Draft B').first()).toBeVisible()
  })
})

test.describe('Customer portal English', () => {
  test.beforeEach(async ({ page }) => {
    await setCustomerPortalSession(page)
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_locale', 'en')
    })
  })

  test('customer portal shows English title and estimates section', async ({ page }) => {
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-title')).toHaveText('Customer Portal')
    await expect(page.getByTestId('customer-portal-estimates-heading')).toHaveText('Your Estimates')
    await expect(page.getByText(/Bathroom Fixture/i).first()).toBeVisible()
  })

  test('customer portal approves estimate in English', async ({ page }) => {
    await page.goto('/portal/customer')
    await resetEstimateStatus(page, 'est-004', 'sent')
    await page.reload()
    await page.getByTestId('portal-estimate-approve-est-004').click()
    await expect(page.getByText('Estimate approved').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/approved/i).first()).toBeVisible()
  })

  test('customer portal declines estimate in English', async ({ page }) => {
    await page.goto('/portal/customer')
    await resetEstimateStatus(page, 'est-004', 'sent')
    await page.reload()
    await page.getByTestId('portal-estimate-decline-est-004').click()
    await expect(page.getByText('Estimate declined').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/declined|rejected/i).first()).toBeVisible()
  })

  test('customer portal shows English invoices section and pays invoice', async ({ page }) => {
    await page.goto('/portal/customer')
    await seedPortalCustomerInvoice(page)
    await expect(page.getByTestId('customer-portal-invoices-heading')).toHaveText('Invoices')
    await expect(page.getByText('INV-PORTAL-E2E').first()).toBeVisible()
    await page.getByTestId('invoice-pay-inv-portal-e2e').click()
    await expect(page.getByTestId('invoice-pay-inv-portal-e2e')).not.toBeVisible({ timeout: 15000 })
  })

  test('customer portal submits review in English', async ({ page }) => {
    await page.goto('/portal/customer')
    await clearPortalReview(page)
    await page.reload()
    await page.getByTestId('customer-portal-leave-review').click()
    await page.getByRole('button', { name: '5' }).click()
    await page.locator('#portal-review-comment').fill('Great work, very responsive team.')
    await page.getByTestId('portal-review-submit').click()
    await expect(page.getByText('Thank you for your review!').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Thanks — you already left a review')).toBeVisible()
  })
})

test.describe('Report PDF profit tab', () => {
  test('Russian locale exports job profitability labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-profit').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Прибыльность заказов/i)
    await expect(popup.locator('body')).toContainText(/Затраты/i)
    await popup.close()
  })

  test('English locale exports job profitability labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-profit').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Job Profitability/i)
    await expect(popup.locator('body')).toContainText(/Costs/i)
    await popup.close()
  })
})

test.describe('Report PDF financial tab', () => {
  test('Russian locale exports revenue by month labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-financial').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Выручка по месяцам/i)
    await expect(popup.locator('body')).toContainText(/Месяц/i)
    await popup.close()
  })

  test('English locale exports revenue by month labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-financial').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Revenue by month/i)
    await expect(popup.locator('body')).toContainText(/Month/i)
    await popup.close()
  })
})

test.describe('Jobs on-hold tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedOnHoldJob(page)
  })

  test('on-hold tab filters to paused jobs only', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByTestId('jobs-tab-on-hold').click()
    await expect(page.getByText('E2E On Hold Job').first()).toBeVisible()
    await expect(page.getByText('E2E Bulk Draft A')).toHaveCount(0)
  })
})

test.describe('Report PDF services tab', () => {
  test('Russian locale exports service profitability labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-services').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Прибыльность услуг/i)
    await expect(popup.locator('body')).toContainText(/Услуга/i)
    await popup.close()
  })

  test('English locale exports service profitability labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-services').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Service Profitability/i)
    await expect(popup.locator('body')).toContainText(/Service/i)
    await popup.close()
  })
})

test.describe('Report PDF customers tab', () => {
  test('Russian locale exports customer table labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-customers').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Клиенты/i)
    await expect(popup.locator('body')).toContainText(/ABC Property Management/i)
    await popup.close()
  })

  test('English locale exports customer table labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-customers').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Customers/i)
    await expect(popup.locator('body')).toContainText(/ABC Property Management/i)
    await popup.close()
  })
})

test.describe('Report PDF expenses tab', () => {
  test('Russian locale exports expense breakdown labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-expenses').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Структура расходов/i)
    await expect(popup.locator('body')).toContainText(/Труд/i)
    await popup.close()
  })

  test('English locale exports expense breakdown labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/reports')
    await page.getByTestId('reports-tab-expenses').click()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Expense Breakdown/i)
    await expect(popup.locator('body')).toContainText(/Labor/i)
    await popup.close()
  })
})

test.describe('Jobs bulk delete', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedBulkDraftJobs(page)
  })

  test('bulk delete removes selected draft jobs', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()

    await page.getByTestId('job-select-job-bulk-001').check()
    await page.getByTestId('job-select-job-bulk-002').check()
    await page.getByTestId('jobs-bulk-delete').click()
    await expect(page.getByTestId('jobs-bulk-delete')).toContainText(/подтвердить удаление|confirm delete/i)
    await page.getByTestId('jobs-bulk-delete').click()

    await expect(page.getByText(/удалено заказов:\s*2|deleted 2 jobs/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('E2E Bulk Draft A')).toHaveCount(0)
    await expect(page.getByText('E2E Bulk Draft B')).toHaveCount(0)
  })
})

test.describe('Jobs bulk on-hold', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedBulkDraftJobs(page)
  })

  test('bulk apply moves selected draft jobs to on hold', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()

    await page.getByTestId('job-select-job-bulk-001').check()
    await page.getByTestId('jobs-bulk-status').click()
    await page.getByRole('option', { name: /приостановлен|on hold/i }).click()
    await page.getByTestId('jobs-bulk-apply').click()

    await expect(page.getByText(/обновлено заказов:\s*1|updated 1 jobs/i).first()).toBeVisible({ timeout: 10000 })
    await page.getByTestId('jobs-tab-on-hold').click()
    await expect(page.getByText('E2E Bulk Draft A').first()).toBeVisible()
    await expect(page.getByText('E2E Bulk Draft B')).toHaveCount(0)
  })
})
