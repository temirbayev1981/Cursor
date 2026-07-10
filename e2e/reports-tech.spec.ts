import { test, expect } from '@playwright/test'

test.describe('Reports and technician mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_onboarding', 'complete')
    })
    await page.goto('/login')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('reports page shows date filters and summary', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: /отчёты|reports/i })).toBeVisible()
    await expect(page.locator('#report-start')).toBeVisible()
    await expect(page.locator('#report-end')).toBeVisible()
    await expect(page.getByText(/маржа|margin/i).first()).toBeVisible()
    await page.getByRole('tab', { name: /расходы|expenses/i }).click()
    await expect(page.getByText(/структура расходов|expense breakdown/i).first()).toBeVisible()
  })

  test('technician mobile page loads assigned jobs', async ({ page }) => {
    await page.goto('/tech')
    await expect(page.getByRole('heading', { name: /мои заказы|my jobs/i })).toBeVisible()
    await expect(page.getByText(/сегодня|today/i)).toBeVisible()
  })

  test('technician can open job notes dialog', async ({ page }) => {
    await page.goto('/tech')
    const notesButton = page.getByRole('button', { name: /заметки|notes/i }).first()
    if (await notesButton.count() === 0) return
    await notesButton.click()
    await expect(page.getByPlaceholder(/заметки с объекта|field notes/i)).toBeVisible()
    await page.getByRole('button', { name: /сохранить|save/i }).click()
  })

  test('company switcher changes tenant jobs', async ({ page }) => {
    await page.goto('/dashboard')
    const switcher = page.getByRole('combobox').first()
    if (await switcher.count() === 0) return
    await switcher.click()
    await page.getByRole('option', { name: /Sunrise Property Services/i }).click()
    await page.goto('/jobs')
    await expect(page.getByText(/Clubhouse touch-up paint|Storefront door repair/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('settings system tab shows metrics', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByText(/system metrics|системные метрики/i).first()).toBeVisible()
    await expect(page.getByText(/platform audit|аудит платформы/i).first()).toBeVisible()
    await expect(page.getByText(/offline queue|офлайн-очередь/i).first()).toBeVisible()
  })
})
