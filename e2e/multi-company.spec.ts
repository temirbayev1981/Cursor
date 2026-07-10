import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Multi-company', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('company switcher changes active tenant', async ({ page }) => {
    await page.goto('/dashboard')
    const switcher = page.getByRole('combobox')
    await expect(switcher).toBeVisible({ timeout: 10000 })
    await switcher.click()
    await page.getByRole('option', { name: /Sunrise Property Services/i }).click()
    await expect(page.getByText(/компания переключена|company switched/i).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /ProFix Handyman/i }).click()
    await expect(page.getByText(/компания переключена|company switched/i).first()).toBeVisible({ timeout: 5000 })
  })
})
