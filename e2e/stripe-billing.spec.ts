import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Stripe billing smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('billing tab shows plan cards and Stripe integration status', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /оплата|billing/i }).click()

    await expect(page.getByTestId('billing-plan-professional')).toBeVisible()
    await expect(page.getByTestId('billing-plan-enterprise')).toBeVisible()
    await expect(page.getByTestId('billing-upgrade-enterprise')).toBeVisible()

    await page.getByRole('tab', { name: /интеграции|integrations/i }).click()
    await expect(page.getByTestId('integration-card-stripe')).toBeVisible()
    await expect(page.getByTestId('integration-card-stripe')).toContainText(/stripe/i)
  })

  test('enterprise upgrade completes in E2E mock without checkout redirect', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /оплата|billing/i }).click()

    await page.getByTestId('billing-upgrade-enterprise').click()
    await expect(page.getByText(/план обновлён|plan upgraded/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('billing-plan-enterprise').getByText(/текущий|current/i)).toBeVisible()
  })
})
