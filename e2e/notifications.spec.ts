import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob, clearNotificationQueue } from './helpers/auth'

test.describe('Notification queue flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await clearNotificationQueue(page)
  })

  test('scheduling a draft job queues customer email locally', async ({ page }) => {
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
    await expect(page.getByText(/Email.*очереди|email queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/workorders@abcprop\.com/i).first()).toBeVisible()
  })

  test('notification bell shows queued email after scheduling', async ({ page }) => {
    await seedDraftJob(page)
    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    const scheduleForm = page.locator('form').filter({ has: page.getByText(/^Заказ$|^Job$/i) })
    await scheduleForm.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await scheduleForm.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await scheduleForm.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    await expect(page.getByText(/Email.*очереди|email queued/i).first()).toBeVisible({ timeout: 5000 })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /уведомления|notifications/i }).click()
    await expect(page.getByText(/workorders@abcprop\.com/i).first()).toBeVisible()
    await expect(page.getByText(/в очереди|queued/i).first()).toBeVisible()

    await page.getByRole('button', { name: /^очистить$|^clear$/i }).click()
    await expect(page.getByText(/нет недавних уведомлений|no recent notifications/i)).toBeVisible()
  })

  test('scheduling respects customer email opt-out', async ({ page }) => {
    await seedDraftJob(page)
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-001', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    const scheduleForm = page.locator('form').filter({ has: page.getByText(/^Заказ$|^Job$/i) })
    await scheduleForm.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await scheduleForm.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await scheduleForm.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    await expect(page.getByText(/заказ добавлен в расписание|job added to schedule/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Email.*очереди|email queued/i)).not.toBeVisible()
  })

  test('scheduling skips customer SMS when opted out', async ({ page }) => {
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
    await expect(page.getByText(/SMS.*отключён|SMS disabled|opt-out/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })

  test('scheduling queues customer SMS when enabled', async ({ page }) => {
    await seedDraftJob(page)
    await page.goto('/customers')
    await page.getByTestId('customer-edit-cust-001').click()
    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) !== 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    const scheduleForm = page.locator('form').filter({ has: page.getByText(/^Заказ$|^Job$/i) })
    await scheduleForm.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await scheduleForm.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await scheduleForm.getByRole('button', { name: /запланировать заказ|schedule job/i }).click()

    await expect(page.getByText(/SMS.*очереди|SMS queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })
})
