import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Technicians mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows technician cards on small screens', async ({ page }) => {
    await page.goto('/technicians')
    await expect(visibleText(page, 'James Rodriguez', true).first()).toBeVisible()
    await expect(visibleText(page, 'Marcus Thompson', true).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })
})
