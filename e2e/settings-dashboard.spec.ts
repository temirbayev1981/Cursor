import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Settings billing & team', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await loginAsOwner(page, 'ru')
  })

  test('billing upgrade to enterprise updates current plan without Stripe in E2E', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /оплата|billing/i }).click()

    const professional = page.getByTestId('billing-plan-professional')
    await expect(professional.getByText(/текущий|current/i)).toBeVisible()
    await expect(page.getByTestId('billing-upgrade-enterprise')).toBeVisible()

    await page.getByTestId('billing-upgrade-enterprise').click()
    await expect(page.getByText(/план обновлён|plan upgraded/i).first()).toBeVisible({ timeout: 10000 })

    const enterprise = page.getByTestId('billing-plan-enterprise')
    await expect(enterprise.getByText(/текущий|current/i)).toBeVisible()
    await expect(professional.getByText(/текущий|current/i)).not.toBeVisible()
  })

  test('team invite form adds pending invite row', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /команда|team/i }).click()

    await page.getByTestId('team-invite-email').fill('e2e-invite@handyman.test')
    await page.getByTestId('team-invite-submit').click()

    await expect(page.getByText(/ссылка-приглашение скопирована|invite link copied/i).first()).toBeVisible({ timeout: 10000 })
    const pending = page.getByTestId('team-pending-invites')
    await expect(pending.getByText('e2e-invite@handyman.test').first()).toBeVisible()
    await expect(pending.getByText(/technician/i).first()).toBeVisible()
  })

  test('system tab shows localized audit log after team invite', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /команда|team/i }).click()
    await page.getByTestId('team-invite-email').fill('audit-log-e2e@test.com')
    await page.getByTestId('team-invite-submit').click()
    await expect(page.getByText(/ссылка-приглашение скопирована|invite link copied/i).first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByText(/приглашение в команду отправлено|team invite sent/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('system tab shows platform audit checklist and coverage summary', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByTestId('platform-audit-checklist')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-audit_e2e_full')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-integration_probes')).toBeVisible()
    await expect(page.getByTestId('audit-coverage-summary')).toBeVisible()
    await expect(page.getByTestId('audit-coverage-summary')).toHaveText(/\d+.*(?:типов действий в журнале|action types in log).*\d+.*(?:локализованных меток|localized labels)/i)
  })
})

test.describe('Dashboard analytics', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('executive dashboard shows stat cards and chart sections', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /панель руководителя|executive dashboard/i })).toBeVisible()

    const stats = page.getByTestId('dashboard-stat-cards')
    await expect(stats.getByText(/выручка сегодня|revenue today/i).first()).toBeVisible()
    await expect(stats.getByText(/открытые заказы|open jobs/i).first()).toBeVisible()

    const charts = page.getByTestId('dashboard-charts')
    await expect(charts.getByText(/динамика выручки|revenue.*trend/i).first()).toBeVisible()
    await expect(charts.getByText(/структура расходов|expense breakdown/i).first()).toBeVisible()
    await expect(charts.getByRole('img').first()).toBeVisible({ timeout: 10000 })
  })

  test('dashboard recent jobs lists demo jobs with status badges', async ({ page }) => {
    await page.goto('/dashboard')
    const recent = page.getByTestId('dashboard-recent-jobs')
    await expect(recent.getByText(/последние заказы|recent jobs/i).first()).toBeVisible()
    await expect(recent.getByText(/Drywall Repair|Bathroom Faucet/i).first()).toBeVisible({ timeout: 10000 })
    await expect(recent.getByText(/ABC Property Management/i).first()).toBeVisible()
    await expect(recent.getByText(/в работе|in progress|запланирован|scheduled/i).first()).toBeVisible()
  })

  test('dashboard service and technician charts render bar data', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/прибыльные услуги|profitable services/i).first()).toBeVisible()
    await expect(page.getByText(/эффективность мастеров|technician performance/i).first()).toBeVisible()
    await expect(page.getByRole('img').filter({ hasText: /J R\.|M T\.|Drywall|Plumb/i }).first()).toBeVisible({ timeout: 10000 })
  })
})
