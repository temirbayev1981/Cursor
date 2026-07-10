import { test, expect } from '@playwright/test'
import { loginAsOwner, openSettingsAuditTab, seedInProgressTechJob } from './helpers/auth'

test.describe('Expanded audit log E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('customer create appears in localized audit log', async ({ page }) => {
    await page.goto('/customers')
    await page.getByRole('button', { name: /добавить клиента|add customer/i }).click()

    const form = page.getByTestId('customer-form')
    await form.locator('input').first().fill('E2E Audit Customer')
    await form.locator('input[type="email"]').fill('e2e.audit.customer@example.com')
    await form.locator('input').nth(2).fill('555-0199')
    await form.locator('input').nth(3).fill('200 Audit Lane, Austin, TX')
    await page.getByTestId('customer-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="customer.create"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/клиент создан|customer created/i).first()).toBeVisible()
  })

  test('estimate to invoice conversion appears in audit log', async ({ page }) => {
    await page.goto('/estimates')
    await expect(page.getByText('Leaking Faucet Repair').first()).toBeVisible()
    await page.getByTestId('estimate-convert-est-002').click()
    await expect(page.getByText(/счёт создан из сметы|invoice created from estimate/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="invoice.create"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('technician job completion appears in audit log', async ({ page }) => {
    await seedInProgressTechJob(page)
    await page.goto('/tech')
    await expect(page.getByText(/E2E Offline Tech Job/i)).toBeVisible()

    await page.getByRole('button', { name: /завершить|complete/i }).first().click()
    await expect(page.getByText(/статус заказа обновлён|job status updated/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="job.status_change"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/статус заказа изменён|job status changed/i).first()).toBeVisible()
  })

  test('job create appears in audit log', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByRole('button', { name: /новый заказ|new job/i }).click()
    await page.getByTestId('job-form').locator('input').first().fill('E2E Audit Job')
    await page.getByTestId('job-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await page.getByTestId('job-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="job.create"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('estimate send appears in audit log', async ({ page }) => {
    await page.goto('/estimates')
    await expect(page.getByText('Deck Repair & Staining').first()).toBeVisible()
    await page.getByTestId('estimate-send-est-003').click()
    await expect(page.getByText(/смета отправлена/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="estimate.sent"]').first()).toBeVisible({ timeout: 10000 })
  })
})
