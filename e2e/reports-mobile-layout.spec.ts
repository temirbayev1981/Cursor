import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Reports mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('profit tab shows stacked job cards on small screens', async ({ page }) => {
    await page.goto('/reports')
    await page.getByTestId('reports-tab-profit').click()
    await expect(page.getByTestId(/^report-profit-card-/).locator('visible=true').first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })
})
