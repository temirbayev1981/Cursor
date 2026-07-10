import { test, expect } from '@playwright/test'
import { loginAsOwner, loginForOnboarding, openSettingsAuditTab, seedDraftJob, seedInProgressTechJob } from './helpers/auth'

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

  test('schedule create appears in audit log', async ({ page }) => {
    await seedDraftJob(page)
    await page.goto('/scheduling')
    await page.getByRole('button', { name: /запланировать заказ|schedule from job/i }).first().click()
    await page.getByTestId('schedule-form').getByRole('combobox').first().click()
    await page.getByRole('option', { name: /E2E Draft Job for Scheduling/i }).click()
    await page.getByTestId('schedule-form').getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: /Marcus Thompson/i }).click()
    await page.getByTestId('schedule-form-submit').click()
    await expect(page.getByText(/заказ добавлен в расписание|added to schedule/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="schedule.create"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('inventory receive appears in audit log', async ({ page }) => {
    await page.goto('/materials')
    await page.getByTestId('material-receive-mat-003').click()
    await page.getByTestId('materials-receive-dialog').locator('input[type="number"]').fill('2')
    await page.getByTestId('materials-receive-submit').click()
    await expect(page.getByText(/приход на склад|receive stock/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="inventory.receive"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('inventory apply appears in audit log', async ({ page }) => {
    await page.goto('/jobs')
    await page.getByTestId('job-material-usage-job-001').click()
    await page.getByTestId('job-material-dialog').getByRole('combobox').click()
    await page.getByRole('option', { name: /Joint Compound/i }).click()
    await page.getByTestId('job-material-submit').click()
    await expect(page.getByText(/материалы списаны|materials deducted/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="inventory.apply"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('material create appears in audit log', async ({ page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /добавить материал|add material/i }).click()
    const form = page.getByTestId('material-form')
    await form.locator('input').first().fill('E2E Audit Material')
    await form.locator('input').nth(1).fill('General')
    await form.locator('input').nth(2).fill('Supplier')
    await form.locator('input[type="number"]').first().fill('9.99')
    await page.getByTestId('material-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="material.create"]').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Onboarding audit E2E', () => {
  test('onboarding complete appears in audit log', async ({ page }) => {
    await loginForOnboarding(page, 'ru')
    await page.getByTestId('onboarding-company-name').fill('E2E Audit Onboarding Co')
    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-service').filter({ hasText: /сантехника|plumbing/i }).click()
    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-complete').click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="onboarding.complete"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/онбординг завершён|onboarding completed/i).first()).toBeVisible()
  })
})
