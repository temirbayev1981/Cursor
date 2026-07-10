import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Work orders AI import', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('photo tab analyzes uploaded image and shows AI results', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /анализ фото|photo analysis/i }).click()

    const dropzone = page.getByTestId('work-orders-photo-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/sample.png')

    await expect(page.getByText(/ии-анализ завершён|ai analysis complete/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/результаты ии|ai results/i).first()).toBeVisible()
    await expect(page.getByText(/drywall|гипсокартон|patch/i).first()).toBeVisible()
  })

  test('email tab processes sample work order text', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /импорт из email|email import/i }).click()
    await page.getByRole('button', { name: /обработать письмо|process email/i }).click()

    await expect(page.getByText(/ии-анализ завершён|ai analysis complete/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/результаты ии|ai results/i).first()).toBeVisible()
  })
})
