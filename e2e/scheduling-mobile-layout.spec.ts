import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob } from './helpers/auth'

test.describe('Scheduling mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
    await seedDraftJob(page)
  })

  test('defaults to day view and shows schedule form on small screens', async ({ page }) => {
    await page.goto('/scheduling')
    await expect(page.getByRole('heading', { name: /расписание|scheduling/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /день|day/i })).toBeVisible()
    await page.getByRole('button', { name: /запланировать заказ|schedule from job/i }).first().click()
    await expect(page.getByTestId('schedule-form')).toBeVisible()
  })
})
