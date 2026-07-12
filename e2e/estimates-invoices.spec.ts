import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleTestId } from './helpers/visibility'

test.describe('Estimates & invoices', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('estimates smart engine shows AI recommendation', async ({ page }) => {
    await page.goto('/estimates')
    await page.getByRole('button', { name: /умный движок|smart engine/i }).click()

    const panel = page.getByTestId('estimates-smart-engine-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText(/Drywall Repair/i).first()).toBeVisible()
    await expect(panel.getByText(/уверенность|confidence/i).first()).toBeVisible()
    await expect(panel.getByText(/каталог услуг|service catalog/i).first()).toBeVisible()
  })

  test('create estimate via form adds row to table', async ({ page }) => {
    await page.goto('/estimates')
    await page.getByRole('button', { name: /новая смета|new estimate/i }).click()
    await expect(page.getByTestId('estimate-form')).toBeVisible()

    await page.getByTestId('estimate-form').locator('input').first().fill('E2E Test Estimate')
    await page.getByTestId('estimate-form').getByRole('combobox').click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await page.getByTestId('estimate-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('E2E Test Estimate').first()).toBeVisible()
  })

  test('send draft estimate notifies customer', async ({ page }) => {
    await page.goto('/estimates')
    await expect(page.getByText('Deck Repair & Staining').first()).toBeVisible()
    await page.getByTestId('estimate-send-est-003').click()

    await expect(page.getByText(/смета отправлена.*chen\.family@email\.com/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('send draft estimate skips email when customer opted out', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-004', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/estimates')
    await page.getByTestId('estimate-send-est-003').click()
    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('send draft estimate skips customer SMS when opted out', async ({ page }) => {
    await page.goto('/estimates')
    await page.getByTestId('estimate-send-est-003').click()
    await expect(page.getByText(/смета отправлена|estimate sent/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/SMS.*отключён|SMS disabled/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/567.*8901|\(555\) 567-8901/).first()).toBeVisible()
  })

  test('send draft estimate queues customer SMS when enabled', async ({ page }) => {
    await page.goto('/customers')
    await visibleTestId(page, 'customer-edit-cust-004').click()
    const smsToggle = page.getByTestId('customer-form-notify-sms')
    if ((await smsToggle.getAttribute('data-state')) !== 'checked') {
      await smsToggle.click()
    }
    await page.getByTestId('customer-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/estimates')
    await page.getByTestId('estimate-send-est-003').click()
    await expect(page.getByText(/SMS.*очереди|SMS queued/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/567.*8901|\(555\) 567-8901/).first()).toBeVisible()
  })

  test('convert sent estimate to invoice', async ({ page }) => {
    await page.goto('/estimates')
    await expect(page.getByText('Leaking Faucet Repair').first()).toBeVisible()
    await page.getByTestId('estimate-convert-est-002').click()

    await expect(page.getByText(/счёт создан из сметы|invoice created from estimate/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('manual payment marks sent invoice as paid without Stripe', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page.getByText(/к оплате|outstanding/i).first()).toBeVisible()
    await expect(page.getByText('INV-2026-0141').first()).toBeVisible()

    await page.getByTestId('invoice-pay-inv-002').click()

    await expect(page.getByText(/оплачено|paid/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('INV-2026-0141').first()).toBeVisible()
  })
})
