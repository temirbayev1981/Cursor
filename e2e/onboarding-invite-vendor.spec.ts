import { test, expect } from '@playwright/test'
import { visibleText } from './helpers/visibility'
import { loginAsOwner, loginForOnboarding } from './helpers/auth'

test.describe('Owner onboarding wizard', () => {
  test('completes six-step setup and reaches dashboard', async ({ page }) => {
    await loginForOnboarding(page, 'ru')

    await expect(visibleText(page, /информация о компании|company info/i).first()).toBeVisible()
    await page.getByTestId('onboarding-company-name').fill('E2E Onboarding Co')

    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-service').filter({ hasText: /сантехника|plumbing/i }).click()
    await page.getByTestId('onboarding-next').click()

    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-next').click()
    await page.getByTestId('onboarding-next').click()

    await expect(visibleText(page, /распространённые материалы|common materials/i).first()).toBeVisible()
    await page.getByTestId('onboarding-complete').click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /панель руководителя|executive dashboard/i })).toBeVisible({ timeout: 10000 })
  })

  test('requires company name and service selection before advancing', async ({ page }) => {
    await loginForOnboarding(page, 'ru')

    await expect(page.getByTestId('onboarding-next')).toBeDisabled()
    await page.getByTestId('onboarding-company-name').fill('E2E Validation Co')
    await expect(page.getByTestId('onboarding-next')).toBeEnabled()

    await page.getByTestId('onboarding-next').click()
    await expect(page.getByTestId('onboarding-next')).toBeDisabled()
    await page.getByTestId('onboarding-service').filter({ hasText: /покраска|painting/i }).first().click()
    await expect(page.getByTestId('onboarding-next')).toBeEnabled()
  })
})

test.describe('Invite link errors', () => {
  test('expired invite token shows error alert', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_team_invites', JSON.stringify([{
        id: 'inv-expired',
        company_id: 'comp-001',
        email: 'expired@test.com',
        role: 'technician',
        token: 'expired-invite-token-e2e',
        expires_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date().toISOString(),
      }]))
    })
    await page.goto('/login?invite=expired-invite-token-e2e')
    await expect(page.getByTestId('invite-error')).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, /недействительна|истекла|invalid|expired/i).first()).toBeVisible()
    await expect(visibleText(page, /вас пригласили|you have been invited/i)).not.toBeVisible()
  })

  test('unknown invite token shows error alert', async ({ page }) => {
    await page.goto('/login?invite=unknown-invite-token-e2e')
    await expect(page.getByTestId('invite-error')).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, /недействительна|истекла|invalid|expired/i).first()).toBeVisible()
  })
})

test.describe('Vendor PO export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('export excel downloads vendor PO spreadsheet', async ({ page }) => {
    await page.goto('/work-orders')
    await expect(visibleText(page, /Vendor PO/i).first()).toBeVisible({ timeout: 15000 })
    await page.getByRole('tab', { name: /vendor po/i }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('vendor-po-export-excel').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/vendor-po-export\.xlsx$/i)
  })
})
