import { test, expect } from '@playwright/test'

test.describe('HandymanOS AI', () => {
  test('login and reach dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
  })

  test('vendor PO tab loads on work orders', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    if (page.url().includes('onboarding')) {
      await page.goto('/work-orders')
    } else {
      await page.goto('/work-orders')
    }
    await expect(page.getByText(/Vendor PO|PDF/i).first()).toBeVisible()
  })
})
