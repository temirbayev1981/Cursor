import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { expectJobTitleVisible, visibleText } from './helpers/visibility'

test.describe('Jobs mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsOwner(page, 'ru')
  })

  test('shows card layout on small screens', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByTestId(/^job-card-/).first()).toBeVisible()
    await expect(page.getByRole('table')).not.toBeVisible()
  })

  test('job title is visible in mobile cards after create', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('button', { name: /новый заказ|new job/i }).click()
    await page.getByTestId('job-form').locator('input').first().fill('E2E Mobile Card Job')
    await page.getByTestId('job-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await page.getByTestId('job-form-submit').click()

    await expect(visibleText(page, /сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expectJobTitleVisible(page, 'E2E Mobile Card Job')
    await expect(page.getByTestId(/^job-card-/).filter({ hasText: 'E2E Mobile Card Job' }).first()).toBeVisible()
  })
})
