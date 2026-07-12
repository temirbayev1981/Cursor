import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedDraftJob(page)
  })

  test('scheduling page shows week view and technician availability', async ({ page }) => {
    await page.goto('/scheduling')
    await expect(page.getByRole('heading', { name: /расписание|scheduling/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /неделя|week/i })).toBeVisible()
    await expect(visibleText(page, /доступность мастеров|technician availability/i).first()).toBeVisible()
    await expect(visibleText(page, /James Rodriguez|Marcus Thompson/i).first()).toBeVisible()
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

    await expect(visibleText(page, /заказ добавлен в расписание|added to schedule/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, 'E2E Draft Job for Scheduling', true).first()).toBeVisible()
    await expect(visibleText(page, 'Marcus Thompson', true).first()).toBeVisible()
  })

  test('scheduling page shows English labels', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await seedDraftJob(page)
    await page.goto('/scheduling')

    await expect(page.getByRole('heading', { name: 'Scheduling' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Week' })).toBeVisible()
    await expect(visibleText(page, /technician availability/i).first()).toBeVisible()
    await page.getByRole('button', { name: /schedule job/i }).first().click()
    await expect(page.getByTestId('schedule-form')).toBeVisible()
  })
})
