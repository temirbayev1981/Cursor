import { test, expect } from '@playwright/test'
import { loginAsOwner, seedDraftInvoice } from './helpers/auth'

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
    await expect(page.getByText('200 N Lasalle St').first()).toBeVisible()
  })

  test('highlights emergency priority vendor PO rows', async ({ page }) => {
    await page.goto('/work-orders')
    await page.getByRole('tab', { name: /vendor po/i }).click()
    await expect(page.getByText('210214-01').first()).toBeVisible({ timeout: 15000 })
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
  })

  test('send draft invoice queues customer email without webhook', async ({ page }) => {
    await seedDraftInvoice(page)
    await page.goto('/invoices')
    await expect(page.getByText('INV-E2E-DRAFT').first()).toBeVisible()
    await page.getByTestId('invoice-send-inv-e2e-draft').click()
    await expect(page.getByText(/счёт отправлен.*workorders@abcprop\.com/i).first()).toBeVisible({ timeout: 10000 })
  })
})
