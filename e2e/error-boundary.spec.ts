import { test, expect } from '@playwright/test'
import { visibleText } from './helpers/visibility'

test.describe('Error boundary', () => {
  test('shows localized error UI and records report (RU)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_locale', 'ru')
      localStorage.removeItem('handymanos_error_reports')
    })
    await page.goto('/e2e/crash')
    await expect(page.getByRole('alert')).toContainText(/что-то пошло не так/i)
    await expect(visibleText(page, /E2E crash test/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /перезагрузить|reload/i })).toBeVisible()

    const reportCount = await page.evaluate(() => {
      const reports = JSON.parse(localStorage.getItem('handymanos_error_reports') || '[]') as Array<{ message: string }>
      return reports.filter((r) => r.message === 'E2E crash test').length
    })
    expect(reportCount).toBe(1)
  })

  test('shows English error copy when locale is EN', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_locale', 'en')
    })
    await page.goto('/e2e/crash')
    await expect(page.getByRole('alert')).toContainText(/something went wrong/i)
    await expect(page.getByRole('button', { name: /reload/i })).toBeVisible()
  })
})
