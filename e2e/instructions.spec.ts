import { test, expect } from '@playwright/test'

test.describe('Instructions page', () => {
  test('renders formatted user guide with table of contents', async ({ page }) => {
    await page.goto('/instructions')
    await expect(page.getByRole('heading', { name: /руководство|user guide/i })).toBeVisible()
    await expect(page.locator('.instructions-doc h2, .instructions-doc h3').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('instructions-toc')).toBeVisible({ timeout: 10000 })
  })

  test('login page links to instructions', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /руководство|user guide|instructions/i })).toBeVisible()
    await page.getByRole('link', { name: /руководство|user guide|instructions/i }).click()
    await expect(page).toHaveURL(/\/instructions/)
    await expect(page.locator('.instructions-doc')).toBeVisible({ timeout: 10000 })
  })
})
