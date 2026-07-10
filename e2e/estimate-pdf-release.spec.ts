import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Estimate PDF export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('export PDF opens estimate preview with title and total', async ({ page }) => {
    await page.goto('/estimates')
    await expect(page.getByText('Drywall Repair & Paint - Unit 204').first()).toBeVisible()

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('estimate-export-pdf-est-001').click()
    const popup = await popupPromise

    await expect(popup.locator('h1')).toContainText('Drywall Repair & Paint - Unit 204')
    await expect(popup.locator('body')).toContainText('ABC Property Management')
    await expect(popup.locator('body')).toContainText('$1050.00')
    await popup.close()
  })

  test('estimate PDF preview includes line items table', async ({ page }) => {
    await page.goto('/estimates')
    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('estimate-export-pdf-est-001').click()
    const popup = await popupPromise

    await expect(popup.locator('body')).toContainText(/Drywall repair/i)
    await expect(popup.locator('body')).toContainText(/Wall painting/i)
    await expect(popup.locator('body')).toContainText(/Line items/i)
    await popup.close()
  })
})
