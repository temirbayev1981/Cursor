import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftInvoice, clearNotificationQueue } from './helpers/auth'
import { expectJobTitleVisible, visibleTestId, visibleText } from './helpers/visibility'

test.describe('Vendor PO multi-site', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('shows multi-site grouping badge for duplicate addresses', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /vendor po/i }).click()
    await expect(page.getByTestId('vendor-po-multi-site-badge')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('vendor-po-multi-site-badge')).toContainText(/1/)
    await expect(page.getByText(/несколькими нарядами|multiple orders/i).first()).toBeVisible()
    await expect(visibleText(page, '200 N Lasalle St', true).first()).toBeVisible()
  })

  test('highlights emergency priority vendor PO rows', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /vendor po/i }).click()
    await expect(visibleText(page, '210214-01', true).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/P1.*EMERGENCY|EMERGENCY/i).first()).toBeVisible()
  })
})

test.describe('AI assistant follow-up', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('supports multi-turn chat with suggested and custom questions', async ({ page }) => {
    await page.goto('/ai-assistant')
    await page.getByTestId('ai-suggested-question').filter({ hasText: /увеличить прибыль|increase profit/i }).click()
    await expect(page.getByText(/оптимизац|routing|маршрут/i).first()).toBeVisible({ timeout: 10000 })

    const followUp = 'Какой мастер самый прибыльный?'
    await page.getByTestId('ai-chat-input').fill(followUp)
    await page.getByTestId('ai-chat-submit').click()

    await expect(page.getByTestId('ai-chat-user-message').last()).toContainText(followUp)
    await expect(page.getByText(/James Rodriguez|Marcus Thompson/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('ai-chat-assistant-message')).toHaveCount(3)
  })
})

test.describe('Global search & invoice send', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('header search finds job and navigates to jobs page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByTestId('global-search-input').fill('Drywall Repair')
    const results = page.getByTestId('global-search-results')
    await expect(results.getByText(/Drywall Repair/i).first()).toBeVisible({ timeout: 10000 })
    await results.getByRole('button').first().click()
    await expect(page).toHaveURL(/\/jobs/, { timeout: 10000 })
    await expectJobTitleVisible(page, 'Drywall Repair & Paint - Unit 204')
  })

  test('send draft invoice queues customer email without webhook', async ({ page }) => {
    await seedDraftInvoice(page)
    await page.goto('/invoices')
    await expect(visibleText(page, 'INV-E2E-DRAFT').first()).toBeVisible()
    await visibleTestId(page, 'invoice-send-inv-e2e-draft').click()
    await expect(page.getByText(/счёт отправлен.*workorders@abcprop\.com/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('send draft invoice skips email when customer opted out', async ({ page }) => {
    await seedDraftInvoice(page)
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-001', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/invoices')
    await visibleTestId(page, 'invoice-send-inv-e2e-draft').click()
    await expect(page.getByText(/email disabled|email отключён/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('send draft invoice skips customer SMS when opted out', async ({ page }) => {
    await clearNotificationQueue(page)
    await seedDraftInvoice(page)
    await page.goto('/invoices')
    await visibleTestId(page, 'invoice-send-inv-e2e-draft').click()
    await expect(page.getByText(/счёт отправлен|invoice sent/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/SMS.*отключён|SMS disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })

  test('send draft invoice queues customer SMS when enabled', async ({ page }) => {
    await clearNotificationQueue(page)
    await seedDraftInvoice(page)
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-001').click()
    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) !== 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/invoices')
    await visibleTestId(page, 'invoice-send-inv-e2e-draft').click()
    await expect(page.getByText(/SMS.*очереди|SMS queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
  })
})
