import { test, expect } from '@playwright/test'
import { loginAsOwner, seedScheduledRouteJob } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Dispatch mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
    await seedScheduledRouteJob(page)
  })

  test('shows dispatch board columns on small screens', async ({ page }) => {
    await page.goto('/dispatch')
    await expect(page.getByTestId('dispatch-column-scheduled')).toBeVisible()
    await expect(visibleText(page, 'E2E Scheduled Route Job', true).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })
})
