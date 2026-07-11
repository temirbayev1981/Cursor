import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginAsOwner } from './helpers/auth'

const IMPACT_LEVELS = new Set(['critical', 'serious'])

test.describe('Axe accessibility', () => {
  test('login page has no critical or serious axe violations', async ({ page }) => {
    await page.goto('/login')
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze()

    const blocking = results.violations.filter((v) => IMPACT_LEVELS.has(v.impact ?? ''))
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
  })

  test('instructions page has no critical or serious axe violations', async ({ page }) => {
    await page.goto('/instructions')
    await expect(page.locator('.instructions-doc')).toBeVisible({ timeout: 15000 })

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze()

    const blocking = results.violations.filter((v) => IMPACT_LEVELS.has(v.impact ?? ''))
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
  })

  test('customers table pagination is visible after login', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/customers')
    await expect(page.getByTestId('customers-pagination')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('customers-pagination-prev')).toBeVisible()
    await expect(page.getByTestId('customers-pagination-next')).toBeVisible()
  })

  test('jobs and invoices tables expose server pagination controls', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/jobs')
    await expect(page.getByTestId('jobs-pagination')).toBeVisible({ timeout: 15000 })
    await page.goto('/invoices')
    await expect(page.getByTestId('invoices-pagination')).toBeVisible({ timeout: 15000 })
  })

  test('settings integrations tab has no critical axe violations', async ({ page }) => {
    await loginAsOwner(page, 'en')
    await page.goto('/settings')
    await page.getByRole('tab', { name: /integrations/i }).click()
    await expect(page.getByTestId('integration-card-supabase')).toBeVisible({ timeout: 15000 })

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze()

    const blocking = results.violations.filter((v) => IMPACT_LEVELS.has(v.impact ?? ''))
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
  })
})
