import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Dashboard mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows recent jobs cards on small screens', async ({ page }) => {
    await page.goto('/dashboard')
    const recent = page.getByTestId('dashboard-recent-jobs')
    await expect(recent).toBeVisible()
    await expect(recent.locator('visible=true').getByText(/Drywall Repair|Bathroom Faucet/i).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })
})
