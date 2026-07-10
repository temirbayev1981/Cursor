import { test, expect } from '@playwright/test'
import { loginAsOwner, seedInProgressTechJob } from './helpers/auth'

test.describe('Reports and technician mobile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
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
    await seedInProgressTechJob(page)
    await page.goto('/tech')
    const notesButton = page.getByRole('button', { name: /заметки|notes/i }).first()
    await expect(notesButton).toBeVisible()
    await notesButton.click()
    await expect(page.getByPlaceholder(/заметки с объекта|field notes/i)).toBeVisible()
    await page.getByRole('button', { name: /сохранить|save/i }).click()
  })

  test('company switcher changes tenant jobs', async ({ page }) => {
    await page.goto('/dashboard')
    const switcher = page.getByRole('combobox').first()
    await expect(switcher).toBeVisible()
    await switcher.click()
    await page.getByRole('option', { name: /Sunrise Property Services/i }).click()
    await page.goto('/jobs')
    await expect(page.getByText(/Clubhouse touch-up paint|Storefront door repair/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('settings integrations tab shows configure badges in demo', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /интеграции|integrations/i }).click()
    await expect(page.getByText(/^Stripe$/i)).toBeVisible()
    await expect(page.getByText(/^Supabase$/i)).toBeVisible()
    await expect(page.getByText(/настроить|configure/i).first()).toBeVisible()
  })

  test('settings system tab shows metrics', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByText(/system metrics|системные метрики/i).first()).toBeVisible()
    await expect(page.getByText(/platform audit|аудит платформы/i).first()).toBeVisible()
    await expect(page.getByText(/offline queue|офлайн-очередь/i).first()).toBeVisible()
  })
})
