import { test, expect, devices } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

const iPhone13 = devices['iPhone 13']

test.use({
  viewport: iPhone13.viewport,
  userAgent: iPhone13.userAgent,
  deviceScaleFactor: iPhone13.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
})

test.describe('Mobile smoke (iPhone 13 viewport, Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'en')
  })

  test('dashboard renders on mobile viewport', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /executive dashboard/i })).toBeVisible({ timeout: 15000 })
  })

  test('customers table pagination is usable on mobile', async ({ page }) => {
    await page.goto('/customers')
    await expect(page.getByTestId(/^customer-card-/).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('customers-pagination-mobile')).toBeVisible()
    await expect(page.getByTestId('customers-pagination-mobile-next')).toBeVisible()
  })

  test('settings integrations tab shows QuickBooks coming soon card', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /integrations/i }).click()
    await expect(page.getByTestId('integration-card-quickbooks')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('integration-status-quickbooks')).toHaveText(/coming soon/i)
  })
})
