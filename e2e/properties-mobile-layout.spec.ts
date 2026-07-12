import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Properties mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows property cards on small screens', async ({ page }) => {
    await page.goto('/properties')
    await expect(visibleText(page, 'Riverside Apartments - Unit 204', true).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })
})
