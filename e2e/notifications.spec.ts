import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob, clearNotificationQueue } from './helpers/auth'

test.describe('Notification demo flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await clearNotificationQueue(page)
  })

  test('scheduling a draft job queues demo email notification', async ({ page }) => {
    await seedDraftJob(page)
    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    const scheduleForm = page.locator('form').filter({ has: page.getByText(/^Заказ$|^Job$/i) })
    await scheduleForm.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await scheduleForm.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await scheduleForm.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    await expect(page.getByText(/заказ добавлен в расписание|job added to schedule/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Email \(демо\)|Email \(demo\)/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/workorders@abcprop\.com/i).first()).toBeVisible()
  })

  test('notification bell shows queued demo email after scheduling', async ({ page }) => {
    await seedDraftJob(page)
    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    const scheduleForm = page.locator('form').filter({ has: page.getByText(/^Заказ$|^Job$/i) })
    await scheduleForm.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await scheduleForm.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await scheduleForm.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    await expect(page.getByText(/Email \(демо\)|Email \(demo\)/i).first()).toBeVisible({ timeout: 5000 })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /уведомления|notifications/i }).click()
    await expect(page.getByText(/workorders@abcprop\.com/i).first()).toBeVisible()
    await expect(page.getByText(/демо|demo/i).first()).toBeVisible()

    await page.getByRole('button', { name: /^очистить$|^clear$/i }).click()
    await expect(page.getByText(/нет недавних уведомлений|no recent notifications/i)).toBeVisible()
  })
})
