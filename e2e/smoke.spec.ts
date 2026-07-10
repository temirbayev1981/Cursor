import { test, expect } from '@playwright/test'

test.describe('HandymanOS AI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
    if (page.url().includes('onboarding')) {
      await page.goto('/dashboard')
    }
  })

  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /панель|dashboard/i })).toBeVisible()
  })

  test('vendor PO tab on work orders', async ({ page }) => {
    await page.goto('/work-orders')
    await expect(page.getByText(/Vendor PO|PDF/i).first()).toBeVisible()
  })

  test('invoices page shows outstanding', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByText(/к оплате|outstanding/i).first()).toBeVisible()
  })
})
