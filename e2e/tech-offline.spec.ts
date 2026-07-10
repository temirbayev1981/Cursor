import { test, expect } from '@playwright/test'
import {
  loginAsOwner,
  seedInProgressTechJob,
  clearOfflineQueue,
  setPageOffline,
  setPageOnline,
} from './helpers/auth'

test.describe('Technician mobile offline sync', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await clearOfflineQueue(page)
    await seedInProgressTechJob(page)
  })

  test('saving job notes offline queues action and syncs when online', async ({ page, context }) => {
    await page.goto('/tech')
    await expect(page.getByRole('heading', { name: /мои заказы|my jobs/i })).toBeVisible()
    await expect(page.getByText(/E2E Offline Tech Job/i)).toBeVisible()

    await setPageOffline(page, context)
    await expect(page.getByText(/офлайн|offline/i).first()).toBeVisible()

    await page.getByRole('button', { name: /заметки|notes/i }).first().click()
    await page.getByPlaceholder(/заметки с объекта|field notes/i).fill('Offline E2E note update')
    await page.getByRole('button', { name: /сохранить|save/i }).click()

    await expect(page.getByText(/сохранено офлайн|saved offline/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/1.*ожидает синхронизации|1.*pending sync/i).first()).toBeVisible()

    const queueLen = await page.evaluate(() => {
      const queue = JSON.parse(localStorage.getItem('handymanos_offline_queue') || '[]') as Array<{ type: string }>
      return queue.filter((a) => a.type === 'update_job').length
    })
    expect(queueLen).toBe(1)

    await setPageOnline(page, context)
    await expect(page.getByText(/офлайн-данные синхронизированы|offline data synced/i).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/ожидает синхронизации|pending sync/i)).toHaveCount(0)
  })

  test('clock-in offline queues time entry and syncs when online', async ({ page, context }) => {
    await page.goto('/tech')
    await expect(page.getByText(/E2E Offline Tech Job/i)).toBeVisible()

    await setPageOffline(page, context)
    await expect(page.getByText(/офлайн|offline/i).first()).toBeVisible()

    await page.getByRole('button', { name: /отметить приход|clock in/i }).first().click()
    await expect(page.getByText(/сохранено офлайн|saved offline/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/1.*ожидает синхронизации|1.*pending sync/i).first()).toBeVisible()

    const queueLen = await page.evaluate(() => {
      const queue = JSON.parse(localStorage.getItem('handymanos_offline_queue') || '[]') as Array<{ type: string }>
      return queue.filter((a) => a.type === 'clock_in').length
    })
    expect(queueLen).toBe(1)

    await setPageOnline(page, context)
    await expect(page.getByText(/офлайн-данные синхронизированы|offline data synced/i).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/ожидает синхронизации|pending sync/i)).toHaveCount(0)
  })
})
