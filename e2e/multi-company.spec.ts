import { test, expect } from '@playwright/test'

test.describe('Multi-company', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_onboarding', 'complete')
      localStorage.setItem('handymanos_auth', 'true')
    })
    await page.goto('/login')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('company switcher changes active tenant', async ({ page }) => {
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /Sunrise Property Services/i }).click()
    await expect(page.getByText(/компания переключена|company switched/i).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /ProFix Handyman/i }).click()
    await expect(page.getByText(/компания переключена|company switched/i).first()).toBeVisible({ timeout: 5000 })
  })
})
