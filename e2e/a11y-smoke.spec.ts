import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Accessibility smoke', () => {
  test('login form fields have associated labels', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    await expect(page.locator('#email')).toHaveAttribute('type', 'email')
  })

  test('instructions page exposes table of contents navigation', async ({ page }) => {
    await page.goto('/instructions')
    await expect(page.getByTestId('instructions-toc')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('instructions-toc').locator('a').first()).toBeVisible()
  })

  test('dashboard shell exposes main landmark after login', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/dashboard')
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
  })
})
