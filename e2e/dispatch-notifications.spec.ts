import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob, clearNotificationQueue } from './helpers/auth'

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
})
