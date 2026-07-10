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

  test('employee create appears in audit log', async ({ page }) => {
    await page.goto('/technicians')
    await page.getByRole('button', { name: /добавить мастера|add technician/i }).click()
    const form = page.getByTestId('employee-form')
    await form.locator('input').first().fill('E2E Audit Technician')
    await form.locator('input').nth(1).fill('Technician')
    await form.locator('input').nth(2).fill('(555) 000-9876')
    await form.locator('input[type="number"]').first().fill('30')
    await form.locator('input[type="number"]').nth(1).fill('80')
    await form.locator('input').last().fill('Audit, E2E')
    await page.getByTestId('employee-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="employee.create"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/сотрудник создан|employee created/i).first()).toBeVisible()
  })

  test('vehicle create appears in audit log', async ({ page }) => {
    await page.goto('/vehicles')
    await page.getByRole('button', { name: /добавить транспорт|add vehicle/i }).click()
    const form = page.getByTestId('vehicle-form')
    await form.locator('input').first().fill('E2E Audit Van')
    await form.locator('input').nth(1).fill('Ford')
    await form.locator('input').nth(2).fill('Transit')
    await form.locator('input[type="number"]').first().fill('2024')
    await form.locator('input').nth(4).fill('AUDIT-42')
    await page.getByTestId('vehicle-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="vehicle.create"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/транспорт добавлен|vehicle created/i).first()).toBeVisible()
  })

  test('expense create appears in audit log', async ({ page }) => {
    await page.goto('/expenses')
    await page.getByRole('button', { name: /добавить расход|add expense/i }).click()
    const form = page.getByTestId('expense-form')
    await form.locator('input').first().fill('Tools')
    await form.locator('input').nth(2).fill('E2E Audit Expense')
    await form.locator('input[type="number"]').fill('29.99')
    await page.getByTestId('expense-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="expense.create"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/расход добавлен|expense created/i).first()).toBeVisible()
  })

  test('fuel log create appears in audit log', async ({ page }) => {
    await page.goto('/vehicles')
    await page.getByRole('button', { name: /добавить заправку|add fuel log/i }).click()
    await expect(page.getByTestId('fuel-log-form')).toBeVisible()
    const form = page.getByTestId('fuel-log-form')
    await form.locator('input[type="number"]').first().fill('42')
    await form.locator('input[type="number"]').nth(1).fill('12.5')
    await form.locator('input[type="number"]').nth(2).fill('3.45')
    await page.getByTestId('fuel-log-form-submit').click()
    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="fuel_log.create"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/заправка добавлена|fuel log created/i).first()).toBeVisible()
  })

  test('dispatch status change appears in audit log', async ({ page }) => {
    await seedDraftJob(page)
    await page.goto('/dispatch')
    await expect(page.getByTestId('dispatch-card-job-e2e-draft')).toBeVisible()
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await expect(
      page.getByTestId('dispatch-column-scheduled').getByTestId('dispatch-status-job-e2e-draft'),
    ).toContainText(/запланирован|scheduled/i, { timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="dispatch.status_change"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/изменение статуса в диспетчеризации|dispatch status changed/i).first()).toBeVisible()
  })

  test('company profile update appears in audit log', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /компания|company/i }).click()
    const nameInput = page.getByRole('tabpanel').locator('input').first()
    await nameInput.fill('E2E Audit Company Name')
    await page.getByTestId('company-profile-save').click()
    await expect(page.getByText(/сохранить изменения|save changes/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="company.profile_update"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/профиль компании обновлён|company profile updated/i).first()).toBeVisible()
  })

  test('audit coverage summary shows unique and total counts', async ({ page }) => {
    await openSettingsAuditTab(page)
    const summary = page.getByTestId('audit-coverage-summary')
    await expect(summary).toBeVisible({ timeout: 10000 })
    await expect(summary).toHaveText(/\d+.*(?:типов действий в журнале|action types in log).*\d+.*(?:локализованных меток|localized labels)/i)
  })
})

test.describe('Vendor PO audit E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_vendor_pos', '[]')
      localStorage.setItem('handymanos_vendor_pos_seeded', 'true')
      localStorage.setItem('__e2e_supabase__vendor_po_records', '[]')
    })
    await loginAsOwner(page, 'ru')
  })

  test('vendor PO to job appears in audit log', async ({ page }) => {
    await page.goto('/work-orders')
    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-sample.pdf')
    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 15000 })
    await page.getByTestId(/vendor-po-create-job-/).first().click()
    await expect(page.getByText(/заказ создан из 207872-02|job created from 207872-02/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="vendor_po_to_job"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/заказ создан из vendor po|job created from vendor po/i).first()).toBeVisible()
  })

  test('emergency vendor PO alert appears in audit log', async ({ page }) => {
    await page.goto('/work-orders')
    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-emergency.pdf')
    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 15000 })
    await page.getByTestId(/vendor-po-create-job-/).first().click()
    await expect(page.getByText(/заказ создан из 210214-01|job created from 210214-01/i).first()).toBeVisible({ timeout: 10000 })

    await openSettingsAuditTab(page)
    await expect(page.locator('[data-audit-action="emergency_alert"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/аварийный vendor po|emergency vendor po alert/i).first()).toBeVisible()
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
