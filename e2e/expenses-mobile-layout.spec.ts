import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Expenses mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows card layout on small screens', async ({ page }) => {
    await page.goto('/expenses')
    await expect(page.getByTestId(/^expense-card-/).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
    await expect(page.getByTestId('expenses-pagination-mobile')).toBeVisible()
  })
})
