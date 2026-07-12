import { test, expect } from '@playwright/test'
import { loginAsOwner, openCommandPalette } from './helpers/auth'
import { visibleText } from './helpers/visibility'

test.describe('Technicians', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('technicians page shows demo team cards with cost metrics', async ({ page }) => {
    await page.goto('/technicians')
    await expect(page.getByRole('heading', { name: /мастера|technicians/i })).toBeVisible()
    await expect(visibleText(page, 'James Rodriguez', true).first()).toBeVisible()
    await expect(visibleText(page, 'Marcus Thompson', true).first()).toBeVisible()
    await expect(visibleText(page, 'Plumbing', true).first()).toBeVisible()
    await expect(page.getByText(/ставка|billing rate/i).first()).toBeVisible()
    await expect(page.getByText(/маржа|margin/i).first()).toBeVisible()
  })

  test('create technician via form adds team card', async ({ page }) => {
    await page.goto('/technicians')
    await page.getByRole('button', { name: /добавить мастера|add technician/i }).click()
    await expect(page.getByTestId('employee-form')).toBeVisible()

    const form = page.getByTestId('employee-form')
    await form.locator('input').first().fill('E2E Test Technician')
    await form.locator('input').nth(1).fill('Technician')
    await form.locator('input').nth(2).fill('(555) 000-1234')
    await form.locator('input[type="number"]').first().fill('30')
    await form.locator('input[type="number"]').nth(1).fill('80')
    await form.locator('input').last().fill('Tile, Grout')
    await page.getByTestId('employee-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, 'E2E Test Technician', true).first()).toBeVisible()
    await expect(visibleText(page, 'Tile', true).first()).toBeVisible()
  })
})

test.describe('Theme & reports export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('settings theme toggle switches document dark class', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByTestId('theme-toggle')).toBeVisible()

    const isDarkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    await page.getByTestId('theme-toggle').click()
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.classList.contains('dark')),
    ).toBe(!isDarkBefore)

    const themeAfter = await page.evaluate(() => localStorage.getItem('handymanos_theme'))
    expect(themeAfter).toBe(isDarkBefore ? 'light' : 'dark')
  })

  test('command palette toggles theme', async ({ page }) => {
    await page.goto('/dashboard')
    await openCommandPalette(page)
    await expect(page.getByTestId('command-palette')).toBeVisible({ timeout: 10000 })

    const isDarkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    await page.getByTestId('command-palette').getByRole('option', { name: /светлая тема|тёмная тема/i }).click()
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.classList.contains('dark')),
    ).toBe(!isDarkBefore)
  })

  test('reports technicians tab shows performance chart', async ({ page }) => {
    await page.goto('/reports')
    await page.getByRole('tab', { name: /мастера|technicians/i }).click()
    await expect(page.getByText(/эффективность мастеров|technician performance/i).first()).toBeVisible()
    await expect(page.getByRole('img').filter({ hasText: /J R\.|M T\./ })).toBeVisible({ timeout: 10000 })
  })

  test('reports CSV export downloads spreadsheet', async ({ page }) => {
    await page.goto('/reports')
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('reports-export-csv').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/handymanos-report\.xlsx$/i)
  })
})
