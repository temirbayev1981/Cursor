import { test, expect } from '@playwright/test'
import { loginAsOwner, setCustomerPortalSession, seedDraftJob } from './helpers/auth'
import { visibleTestId } from './helpers/visibility'

test.describe('Customer notification prefs sync', () => {
  test('staff CRM email opt-out syncs to customer portal', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-002').click()
    await expect(page.getByTestId('customer-form-notification-prefs')).toBeVisible()

    const emailToggle = page.getByTestId('customer-form-notify-email')
    if ((await emailToggle.getAttribute('data-state')) === 'checked') {
      await emailToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(visibleTestId(page, 'customer-email-optout-cust-002')).toBeVisible({ timeout: 10000 })

    await setCustomerPortalSession(page)
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-notification-prefs')).toBeVisible()
    await expect(page.getByTestId('customer-portal-notify-email')).toHaveAttribute('data-state', 'unchecked')
    await expect(page.getByTestId('customer-portal-email-optout-badge')).toBeVisible()
  })

  test('portal email opt-out syncs to staff CRM', async ({ page }) => {
    await setCustomerPortalSession(page)
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-notification-prefs')).toBeVisible()

    const portalEmailToggle = page.getByTestId('customer-portal-notify-email')
    if ((await portalEmailToggle.getAttribute('data-state')) === 'checked') {
      await portalEmailToggle.click()
      await expect(page.getByText(/настройки уведомлений сохранены|notification preferences saved/i).first()).toBeVisible({ timeout: 5000 })
    }
    await expect(page.getByTestId('customer-portal-email-optout-badge')).toBeVisible()

    await page.evaluate(() => {
      sessionStorage.setItem('__e2e_storage_init__', '1')
      localStorage.setItem('handymanos_locale', 'ru')
      localStorage.setItem('handymanos_onboarding', 'complete')
    })
    await page.goto('/login')
    await page.locator('#email').fill('owner@profixhandyman.com')
    await page.locator('#password').fill('demo1234')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    await page.goto('/customers')
    await expect(visibleTestId(page, 'customer-email-optout-cust-002')).toBeVisible({ timeout: 10000 })
    await visibleTestId(page, 'customer-edit-cust-002').click()
    await expect(page.getByTestId('customer-form-notify-email')).toHaveAttribute('data-state', 'unchecked')
  })

  test('staff CRM SMS opt-out syncs to customer portal', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-002').click()
    await expect(page.getByTestId('customer-form-notification-prefs')).toBeVisible()

    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) === 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await setCustomerPortalSession(page)
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-notification-prefs')).toBeVisible()
    await expect(page.getByTestId('customer-portal-notify-sms')).toHaveAttribute('data-state', 'unchecked')
    await expect(page.getByTestId('customer-portal-sms-optout-badge')).toBeVisible()
  })

  test('portal SMS opt-out syncs to staff CRM', async ({ page }) => {
    await setCustomerPortalSession(page)
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-notification-prefs')).toBeVisible()

    const portalSmsToggle = page.getByTestId('customer-portal-notify-sms')
    if ((await portalSmsToggle.getAttribute('data-state')) === 'checked') {
      await portalSmsToggle.click()
      await expect(page.getByText(/настройки уведомлений сохранены|notification preferences saved/i).first()).toBeVisible({ timeout: 5000 })
    }

    await page.evaluate(() => {
      sessionStorage.setItem('__e2e_storage_init__', '1')
      localStorage.setItem('handymanos_locale', 'ru')
      localStorage.setItem('handymanos_onboarding', 'complete')
    })
    await page.goto('/login')
    await page.locator('#email').fill('owner@profixhandyman.com')
    await page.locator('#password').fill('demo1234')
    await page.getByRole('button', { name: /войти|sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-002').click()
    await expect(page.getByTestId('customer-form-notify-sms')).toHaveAttribute('data-state', 'unchecked')
  })

  test('dispatch skipped toast uses entity prefs from staff CRM', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedDraftJob(page, true)

    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-001').click()
    const emailToggle = page.getByTestId('customer-form-notify-email')
    if ((await emailToggle.getAttribute('data-state')) === 'checked') {
      await emailToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(visibleTestId(page, 'customer-email-optout-cust-001')).toBeVisible({ timeout: 10000 })

    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()

    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Email.*очереди|email queued/i)).not.toBeVisible()
  })
})
