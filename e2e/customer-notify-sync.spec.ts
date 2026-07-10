import { test, expect } from '@playwright/test'
import { loginAsOwner, setCustomerPortalSession, seedDraftJob } from './helpers/auth'

test.describe('Customer notification prefs sync', () => {
  test('staff CRM email opt-out syncs to customer portal', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/customers')
    await page.getByTestId('customer-edit-cust-002').click()
    await expect(page.getByTestId('customer-form-notification-prefs')).toBeVisible()

    const emailToggle = page.getByTestId('customer-form-notify-email')
    if ((await emailToggle.getAttribute('data-state')) === 'checked') {
      await emailToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByTestId('customer-email-optout-cust-002')).toBeVisible({ timeout: 10000 })

    await setCustomerPortalSession(page)
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-notification-prefs')).toBeVisible()
    await expect(page.getByTestId('customer-portal-notify-email')).toHaveAttribute('data-state', 'unchecked')
  })

  test('dispatch skipped toast uses entity prefs from staff CRM', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedDraftJob(page, true)

    await page.goto('/customers')
    await page.getByTestId('customer-edit-cust-001').click()
    const emailToggle = page.getByTestId('customer-form-notify-email')
    if ((await emailToggle.getAttribute('data-state')) === 'checked') {
      await emailToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByTestId('customer-email-optout-cust-001')).toBeVisible({ timeout: 10000 })

    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Email.*очереди|email queued/i)).not.toBeVisible()
  })
})
