import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob, clearNotificationQueue } from './helpers/auth'
import { visibleTestId } from './helpers/visibility'

test.describe('Dispatch notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await clearNotificationQueue(page)
    await seedDraftJob(page, true)
  })

  test('status select to scheduled queues SMS and customer email locally', async ({ page }) => {
    await page.goto('/dispatch')
    await expect(page.getByTestId('dispatch-card-job-e2e-draft')).toBeVisible()

    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/SMS.*очереди|SMS queued locally/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Marcus Thompson/i).first()).toBeVisible()
    await expect(page.getByText(/Email.*очереди|email queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/workorders@abcprop\.com/i).first()).toBeVisible()
  })

  test('dispatch board shows kanban columns', async ({ page }) => {
    await page.goto('/dispatch')
    await expect(page.getByRole('heading', { name: /диспетчерская|dispatch board/i })).toBeVisible()
    await expect(page.getByText(/черновик|draft/i).first()).toBeVisible()
    await expect(page.getByText(/запланирован|scheduled/i).first()).toBeVisible()
    await expect(page.getByTestId('dispatch-card-job-e2e-draft')).toBeVisible()
  })

  test('status select to in_progress queues customer ETA email', async ({ page }) => {
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await expect(page.getByText(/Email.*очереди|email queued/i).first()).toBeVisible({ timeout: 5000 })

    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /в работе|in progress/i }).click()
    await expect(page.getByText(/ETA.*очереди|ETA email queued/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('bulk SMS button notifies scheduled technicians', async ({ page }) => {
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await expect(page.getByText(/SMS.*очереди|SMS queued locally/i).first()).toBeVisible({ timeout: 5000 })

    await page.getByTestId('dispatch-bulk-sms').click()
    await expect(page.getByText(/массовое SMS|bulk SMS/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('status select to scheduled skips customer email when opted out', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-001', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/SMS.*очереди|SMS queued locally/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Email.*очереди|email queued/i)).not.toBeVisible()
  })

  test('status select to in_progress skips ETA when customer email opted out', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-001', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /в работе|in progress/i }).click()

    await expect(page.getByText(/ETA.*пропущено|ETA skipped|email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/ETA.*очереди|ETA email queued/i)).not.toBeVisible()
  })

  test('status select to scheduled skips customer SMS when opted out', async ({ page }) => {
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/SMS.*пропущено|SMS skipped|opt-out/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })

  test('status select to scheduled queues customer SMS when enabled', async ({ page }) => {
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-001').click()
    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) !== 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/SMS клиенту.*очереди|Customer SMS queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })

  test('status select to in_progress skips customer ETA SMS when opted out', async ({ page }) => {
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /в работе|in progress/i }).click()

    await expect(page.getByText(/ETA SMS.*пропущено|ETA SMS skipped/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })

  test('status select to in_progress queues customer ETA SMS when enabled', async ({ page }) => {
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-001').click()
    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) !== 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /в работе|in progress/i }).click()

    await expect(page.getByText(/ETA SMS.*очереди|ETA SMS queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })
})
