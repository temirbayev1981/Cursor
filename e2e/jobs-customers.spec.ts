import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { expectCustomerNameVisible, expectJobTitleVisible, visibleTestId, visibleText } from './helpers/visibility'

test.describe('Jobs & customers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('create customer via form adds row to table', async ({ page }) => {
    await page.goto('/customers')
    await page.getByRole('button', { name: /добавить клиента|add customer/i }).click()
    await expect(page.getByTestId('customer-form')).toBeVisible()

    const form = page.getByTestId('customer-form')
    await form.locator('input').first().fill('E2E Test Customer')
    await form.locator('input[type="email"]').fill('e2e.customer@example.com')
    await form.locator('input').nth(2).fill('555-0100')
    await form.locator('input').nth(3).fill('100 E2E Lane, Austin, TX')
    await page.getByTestId('customer-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expectCustomerNameVisible(page, 'E2E Test Customer')
  })

  test('customer form saves email notification opt-out', async ({ page }) => {
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-004').click()
    await expect(page.getByTestId('customer-form-notification-prefs')).toBeVisible()

    const emailToggle = page.getByTestId('customer-form-notify-email')
    const isChecked = await emailToggle.getAttribute('data-state')
    if (isChecked === 'checked') {
      await emailToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleTestId(page, 'customer-email-optout-cust-004')).toBeVisible()
  })

  test('customers table shows SMS opt-out badge by default', async ({ page }) => {
    await page.goto('/customers')
    await expect(visibleTestId(page, 'customer-sms-optout-cust-004')).toBeVisible()
  })

  test('customer form enabling SMS removes opt-out badge', async ({ page }) => {
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-004').click()
    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) !== 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleTestId(page, 'customer-sms-optout-cust-004')).not.toBeVisible()
  })

  test('customer search filters the table', async ({ page }) => {
    await page.goto('/customers')
    await expectCustomerNameVisible(page, 'ABC Property Management')

    await page.getByTestId('customers-search').fill('ABC Property')
    await expectCustomerNameVisible(page, 'ABC Property Management')
    await expect(visibleText(page, 'Mike & Lisa Chen')).not.toBeVisible()

    await page.getByTestId('customers-search').fill('nonexistent-customer-xyz')
    await expect(visibleText(page, 'ABC Property Management')).not.toBeVisible()
  })

  test('copy portal link shows success toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/customers')
    await visibleTestId(page, 'customer-portal-link-cust-001').click()

    await expect(page.getByText(/ссылка на портал скопирована|portal link copied/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('create job via form adds draft to table', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('button', { name: /новый заказ|new job/i }).click()
    await expect(page.getByTestId('job-form')).toBeVisible()

    await page.getByTestId('job-form').locator('input').first().fill('E2E Plumbing Repair')
    await page.getByTestId('job-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await page.getByTestId('job-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expectJobTitleVisible(page, 'E2E Plumbing Repair')
  })

  test('job search and draft status filter', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('button', { name: /новый заказ|new job/i }).click()
    await page.getByTestId('job-form').locator('input').first().fill('E2E Filter Draft Job')
    await page.getByTestId('job-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await page.getByTestId('job-form-submit').click()
    await expectJobTitleVisible(page, 'E2E Filter Draft Job')

    await page.getByTestId('jobs-search').fill('E2E Filter Draft')
    await expectJobTitleVisible(page, 'E2E Filter Draft Job')
    await expect(page.getByText(/electrical panel/i).locator('visible=true').first()).not.toBeVisible()

    await page.getByTestId('jobs-search').fill('')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()
    await expectJobTitleVisible(page, 'E2E Filter Draft Job')
  })
})
