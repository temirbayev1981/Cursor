import { test, expect } from '@playwright/test'
import { loginAsOwner, seedScheduledRouteJob } from './helpers/auth'
import { visibleTestId, visibleText } from './helpers/visibility'

test.describe('Dispatch job map', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedScheduledRouteJob(page)
  })

  test('job map shows scheduled stop address with maps link', async ({ page }) => {
    await page.goto('/dispatch')

    const map = page.getByTestId('dispatch-job-map')
    await expect(map).toBeVisible()
    await expect(map.getByText(/карта объектов|job map/i).first()).toBeVisible()
    await expect(page.getByTestId('dispatch-job-map-fallback')).toBeVisible()
    await expect(page.getByRole('link', { name: /123 Main Street/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /123 Main Street/i }).first()).toHaveAttribute('href', /maps\.google\.com/)
  })

  test('job map title in English locale', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await seedScheduledRouteJob(page)
    await page.goto('/dispatch')

    await expect(page.getByTestId('dispatch-job-map').getByText('Job map').first()).toBeVisible()
    await expect(page.getByTestId('dispatch-job-map-fallback')).toContainText(/set VITE_GOOGLE_MAPS_API_KEY/i)
    await expect(page.getByRole('link', { name: /123 Main Street/i }).first()).toBeVisible()
  })

  test('route optimizer panel shows English labels and open maps link', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await seedScheduledRouteJob(page)
    await page.goto('/dispatch')

    const panel = page.getByTestId('route-optimizer-panel')
    await expect(panel.locator('visible=true').getByText('Route Optimization').first()).toBeVisible()
    await expect(visibleText(page, 'E2E Scheduled Route Job', true).first()).toBeVisible()
    await expect(panel.getByText(/stops/i).first()).toBeVisible()
    await expect(page.getByTestId('route-optimizer-open-maps')).toHaveText('Open in Google Maps')
    await expect(page.getByTestId('route-optimizer-open-maps')).toHaveAttribute('href', /google\.com\/maps/)
  })
})

test.describe('Invoice PDF i18n', () => {
  test('Russian locale uses Russian PDF labels', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/invoices')

    const popupPromise = page.waitForEvent('popup')
    await visibleTestId(page, 'invoice-export-pdf-inv-002').click()
    const popup = await popupPromise

    await expect(popup.locator('h1')).toContainText(/счёт/i)
    await expect(popup.locator('body')).toContainText(/Подытог/i)
    await expect(popup.locator('body')).toContainText(/Баланс/i)
    await expect(popup.locator('body')).toContainText(/Позиции/i)
    await popup.close()
  })

  test('English locale uses English PDF labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/invoices')

    const popupPromise = page.waitForEvent('popup')
    await visibleTestId(page, 'invoice-export-pdf-inv-002').click()
    const popup = await popupPromise

    await expect(popup.locator('h1')).toContainText(/Invoice/i)
    await expect(popup.locator('body')).toContainText(/Subtotal/i)
    await expect(popup.locator('body')).toContainText(/Balance/i)
    await expect(popup.locator('body')).toContainText(/Line items/i)
    await popup.close()
  })
})
