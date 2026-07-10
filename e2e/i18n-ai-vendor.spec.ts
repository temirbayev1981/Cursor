import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('i18n — AI assistant & vendor PO', () => {
  test('AI assistant shows Russian welcome and fallback answer', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/ai-assistant')
    await expect(page.getByText(/ИИ-консультант HandymanOS|ваш ИИ-консультант/i).first()).toBeVisible()
    await page.getByRole('button', { name: /Какие заказы принесли убыток|Which jobs lost money/i }).click()
    await expect(page.getByText(/JOB-0087/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/убыток|loss/i).first()).toBeVisible()
  })

  test('AI assistant in English locale returns English fallback', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/ai-assistant')
    await expect(page.getByText(/HandymanOS AI business consultant/i).first()).toBeVisible()
    await page.getByRole('button', { name: /Which jobs lost money this month/i }).click()
    await expect(page.getByText(/Job #JOB-0087/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/operated at a loss/i).first()).toBeVisible()
  })

  test('vendor PO details show localized compliance checklist (RU)', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/work-orders')
    await expect(page.getByText(/Vendor PO/i).first()).toBeVisible()
    const viewBtn = page.getByRole('button', { name: /просмотр|view/i }).first()
    await expect(viewBtn).toBeVisible({ timeout: 15000 })
    await viewBtn.click()
    await expect(page.getByText(/Чеклист compliance/i).first()).toBeVisible()
    await expect(page.getByText(/Фото до\/после работ/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Создать заказ \+ смету/i })).toBeVisible()
  })

  test('vendor PO details show localized compliance checklist (EN)', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/work-orders')
    await expect(page.getByText(/Vendor PO/i).first()).toBeVisible()
    const viewBtn = page.getByRole('button', { name: /^view$/i }).first()
    await expect(viewBtn).toBeVisible({ timeout: 15000 })
    await viewBtn.click()
    await expect(page.getByText(/Compliance checklist/i).first()).toBeVisible()
    await expect(page.getByText(/Before\/after photos/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Create job \+ estimate/i })).toBeVisible()
  })

  test('language switcher toggles dashboard locale', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await expect(page.getByRole('heading', { name: /панель руководителя/i })).toBeVisible()
    await page.getByRole('button', { name: 'English' }).first().click()
    await expect(page.getByRole('heading', { name: /executive dashboard/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Русский' }).first().click()
    await expect(page.getByRole('heading', { name: /панель руководителя/i })).toBeVisible({ timeout: 5000 })
  })
})
