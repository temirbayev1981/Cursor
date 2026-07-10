import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftJob, clearNotificationQueue } from './helpers/auth'

test.describe('Dispatch notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await clearNotificationQueue(page)
    await seedDraftJob(page, true)
  })

  test('status select to scheduled queues demo SMS and customer email', async ({ page }) => {
    await page.goto('/dispatch')
    await expect(page.getByTestId('dispatch-card-job-e2e-draft')).toBeVisible()

    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/SMS \(демо\)|SMS \(demo\)/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Marcus Thompson/i).first()).toBeVisible()
    await expect(page.getByText(/Email \(демо\)|Email \(demo\)/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/workorders@abcprop\.com/i).first()).toBeVisible()
  })

  test('dispatch board shows kanban columns', async ({ page }) => {
    await page.goto('/dispatch')
    await expect(page.getByRole('heading', { name: /диспетчерская|dispatch board/i })).toBeVisible()
    await expect(page.getByText(/черновик|draft/i).first()).toBeVisible()
    await expect(page.getByText(/запланирован|scheduled/i).first()).toBeVisible()
    await expect(page.getByTestId('dispatch-card-job-e2e-draft')).toBeVisible()
  })
})
