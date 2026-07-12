import { test, expect } from '@playwright/test'
import { visibleText } from './helpers/visibility'
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

    await expect(visibleText(page, /ии-анализ завершён|ai analysis complete/i).first()).toBeVisible({ timeout: 15000 })
    await expect(visibleText(page, /результаты ии|ai results/i).first()).toBeVisible()
    await expect(visibleText(page, /drywall|гипсокартон|patch/i).first()).toBeVisible()
  })

  test('email tab processes sample work order text', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /импорт из email|email import/i }).click()
    await page.getByRole('button', { name: /обработать письмо|process email/i }).click()

    await expect(visibleText(page, /ии-анализ завершён|ai analysis complete/i).first()).toBeVisible({ timeout: 15000 })
    await expect(visibleText(page, /результаты ии|ai results/i).first()).toBeVisible()
  })

  test('pdf tab analyzes pasted work order text', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /загрузка pdf|pdf upload/i }).click()
    await page.getByTestId('work-orders-pdf-analyze').click()

    await expect(visibleText(page, /ии-анализ завершён|ai analysis complete/i).first()).toBeVisible({ timeout: 15000 })
    await expect(visibleText(page, /результаты ии|ai results/i).first()).toBeVisible()
    await expect(visibleText(page, /drywall|гипсокартон|repair/i).first()).toBeVisible()
  })
})
