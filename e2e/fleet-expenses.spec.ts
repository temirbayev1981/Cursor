import { test, expect } from '@playwright/test'
import { loginAsOwner, openCommandPalette } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Fleet & expenses', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('vehicles page shows fleet cards and fuel log table', async ({ page }) => {
    await page.goto('/vehicles')
    await expect(page.getByRole('heading', { name: /транспорт и топливо|vehicles/i })).toBeVisible()
    await expect(visibleText(page, 'Service Van #1').first()).toBeVisible()
    await expect(visibleText(page, /расходы на топливо|monthly fuel/i).first()).toBeVisible()
    await expect(page.getByTestId('vehicles-fuel-logs')).toBeVisible()
    await expect(visibleText(page, /журнал заправок|fuel logs/i).first()).toBeVisible()
    await expect(page.getByTestId('vehicles-fuel-logs').getByRole('table').locator('visible=true')).toBeVisible()
  })

  test('create vehicle via form adds fleet card', async ({ page }) => {
    await page.goto('/vehicles')
    await page.getByRole('button', { name: /добавить транспорт|add vehicle/i }).click()
    await expect(page.getByTestId('vehicle-form')).toBeVisible()

    const form = page.getByTestId('vehicle-form')
    await form.locator('input').first().fill('E2E Service Van')
    await form.locator('input').nth(1).fill('Ford')
    await form.locator('input').nth(2).fill('Transit')
    await form.locator('input[type="number"]').first().fill('2024')
    await form.locator('input').nth(4).fill('E2E-9999')
    await page.getByTestId('vehicle-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, 'E2E Service Van').first()).toBeVisible()
  })

  test('create expense via form adds row and updates monthly total', async ({ page }) => {
    await page.goto('/expenses')
    const totalBefore = await page.getByTestId('expenses-monthly-total').textContent()

    await page.getByRole('button', { name: /добавить расход|add expense/i }).click()
    const form = page.getByTestId('expense-form')
    await form.locator('input').first().fill('Tools')
    await form.locator('input').nth(2).fill('E2E drill purchase')
    await form.locator('input[type="number"]').fill('49.99')
    await page.getByTestId('expense-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, 'E2E drill purchase').first()).toBeVisible()
    await expect(page.getByTestId('expenses-monthly-total')).not.toHaveText(totalBefore ?? '')
  })
})

test.describe('Command palette', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('opens with keyboard shortcut and navigates to jobs', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /панель руководителя|executive dashboard/i })).toBeVisible()
    await openCommandPalette(page)
    await expect(page.getByTestId('command-palette')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('command-palette').getByRole('option', { name: /^заказы$|^jobs$/i }).click()
    await expect(page).toHaveURL(/\/jobs/, { timeout: 10000 })
  })

  test('search finds customer and navigates to customers page', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /панель руководителя|executive dashboard/i })).toBeVisible()
    await openCommandPalette(page)
    await page.getByTestId('command-palette-input').fill('ABC Property')
    await expect(page.getByTestId('command-palette').locator('visible=true').getByText('ABC Property Management').first()).toBeVisible({ timeout: 10000 })
    await page.getByTestId('command-palette').locator('visible=true').getByText('ABC Property Management').first().click()
    await expect(page).toHaveURL(/\/customers/, { timeout: 10000 })
  })
})
