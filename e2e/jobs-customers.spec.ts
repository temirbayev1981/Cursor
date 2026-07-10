import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

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
    await expect(page.getByText('E2E Test Customer').first()).toBeVisible()
  })

  test('customer form saves email notification opt-out', async ({ page }) => {
    await page.goto('/customers')
    await page.getByTestId('customer-edit-cust-004').click()
    await expect(page.getByTestId('customer-form-notification-prefs')).toBeVisible()

    const emailToggle = page.getByTestId('customer-form-notify-email')
    const isChecked = await emailToggle.getAttribute('data-state')
    if (isChecked === 'checked') {
      await emailToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('customer-email-optout-cust-004')).toBeVisible()
  })

  test('customer search filters the table', async ({ page }) => {
    await page.goto('/customers')
    await expect(page.getByText('ABC Property Management').first()).toBeVisible()

    await page.getByTestId('customers-search').fill('ABC Property')
    await expect(page.getByText('ABC Property Management').first()).toBeVisible()
    await expect(page.getByText('Mike & Lisa Chen').first()).not.toBeVisible()

    await page.getByTestId('customers-search').fill('nonexistent-customer-xyz')
    await expect(page.getByText('ABC Property Management').first()).not.toBeVisible()
  })

  test('copy portal link shows success toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/customers')
    await page.getByTestId('customer-portal-link-cust-001').click()

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
    await expect(page.getByText('E2E Plumbing Repair').first()).toBeVisible()
  })

  test('job search and draft status filter', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('button', { name: /новый заказ|new job/i }).click()
    await page.getByTestId('job-form').locator('input').first().fill('E2E Filter Draft Job')
    await page.getByTestId('job-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await page.getByTestId('job-form-submit').click()
    await expect(page.getByText('E2E Filter Draft Job').first()).toBeVisible({ timeout: 10000 })

    await page.getByTestId('jobs-search').fill('E2E Filter Draft')
    await expect(page.getByText('E2E Filter Draft Job').first()).toBeVisible()
    await expect(page.getByText(/electrical panel/i).first()).not.toBeVisible()

    await page.getByTestId('jobs-search').fill('')
    await page.getByRole('tab', { name: /черновик|draft/i }).click()
    await expect(page.getByText('E2E Filter Draft Job').first()).toBeVisible()
  })
})
