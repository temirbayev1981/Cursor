import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Vehicles fuel logs mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows fuel log cards on small screens', async ({ page }) => {
    await page.goto('/vehicles')
    await expect(page.getByTestId('vehicles-fuel-logs')).toBeVisible()
    await expect(page.getByTestId(/^fuel-log-card-/).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
    await expect(page.getByTestId('fuel-logs-pagination-mobile')).toBeVisible()
  })
})
