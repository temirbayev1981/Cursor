import { test, expect } from '@playwright/test'
import { loginAsOwner, seedInProgressTechJob } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Reports and technician mobile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('reports page shows date filters and summary', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: /отчёты|reports/i })).toBeVisible()
    await expect(page.locator('#report-start')).toBeVisible()
    await expect(page.locator('#report-end')).toBeVisible()
    await expect(visibleText(page, /маржа|margin/i).first()).toBeVisible()
    await page.getByRole('tab', { name: /расходы|expenses/i }).click()
    await expect(visibleText(page, /структура расходов|expense breakdown/i).first()).toBeVisible()
  })

  test('technician mobile page loads assigned jobs', async ({ page }) => {
    await page.goto('/tech')
    await expect(page.getByRole('heading', { name: /мои заказы|my jobs/i })).toBeVisible()
    await expect(visibleText(page, /сегодня|today/i)).toBeVisible()
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
    await expect(visibleText(page, /Clubhouse touch-up paint|Storefront door repair/).first()).toBeVisible({ timeout: 10000 })
  })

  test('settings integrations tab shows configure badges', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /интеграции|integrations/i }).click()
    await expect(visibleText(page, /^Stripe$/i)).toBeVisible()
    await expect(visibleText(page, /^Supabase$/i)).toBeVisible()
    await expect(visibleText(page, /настроить|configure/i).first()).toBeVisible()
  })

  test('settings system tab shows metrics', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(visibleText(page, /system metrics|системные метрики/i).first()).toBeVisible()
    await expect(visibleText(page, /platform audit|аудит платформы/i).first()).toBeVisible()
    await expect(visibleText(page, /offline queue|офлайн-очередь/i).first()).toBeVisible()
  })

  test('settings system tab shows localized audit recommendations in Russian', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(visibleText(page, /Подключите Supabase/i).first()).toBeVisible()
    await expect(visibleText(page, /Настройте Stripe/i).first()).toBeVisible()
  })
})
