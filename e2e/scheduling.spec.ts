import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob } from './helpers/auth'

test.describe('Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedDraftJob(page)
  })

  test('scheduling page shows week view and technician availability', async ({ page }) => {
    await page.goto('/scheduling')
    await expect(page.getByRole('heading', { name: /расписание|scheduling/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /неделя|week/i })).toBeVisible()
    await expect(page.getByText(/доступность мастеров|technician availability/i).first()).toBeVisible()
    await expect(page.getByText(/James Rodriguez|Marcus Thompson/i).first()).toBeVisible()
  })

  test('schedule draft job from form adds event to calendar', async ({ page }) => {
    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule from job/i }).first().click()
    await expect(page.getByTestId('schedule-form')).toBeVisible()

    await page.getByTestId('schedule-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await page.getByTestId('schedule-form').getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await page.getByTestId('schedule-form-submit').click()

    await expect(page.getByText(/заказ добавлен в расписание|added to schedule/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('E2E Draft Job for Scheduling').first()).toBeVisible()
    await expect(page.getByText('Marcus Thompson').first()).toBeVisible()
  })
})
