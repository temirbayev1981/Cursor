import { test, expect } from '@playwright/test'
import { loginAsOwner, clearNotificationQueue, seedDraftJob } from './helpers/auth'

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

  test('integrations tab lists integration cards including observability', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /интеграции|integrations/i }).click()
    await expect(page.getByTestId('integration-card-supabase')).toBeVisible()
    await expect(page.getByTestId('integration-card-stripe')).toBeVisible()
    await expect(page.getByTestId('integration-card-observability')).toBeVisible()
    await expect(page.getByTestId('integration-status-supabase')).toBeVisible()
    await expect(page.getByTestId('integration-probes-summary')).toBeVisible()
    await expect(page.getByTestId('integration-probes-refresh')).toBeVisible()
    await expect(page.getByTestId('integration-probe-supabase')).toHaveText(/онлайн|live/i)
  })

  test('system tab shows platform audit checklist and coverage summary', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByTestId('platform-audit-checklist')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-audit_e2e_full')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-integration_probes')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-observability_probe_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-pwa_sw_offline_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-integration_probe_ui_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-integration_probe_history_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-notification_hub_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-portal_notification_prefs_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-notification_opt_out_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-staff_customer_notify_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-notify_skipped_toast_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-portal_staff_notify_sync_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-notification_hub_skip_log_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-notification_hub_skip_ops_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-customer_sms_opt_out_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-scheduling_customer_sms_audit')).toBeVisible()
    await expect(page.getByTestId('platform-audit-check-estimate_invoice_sms_audit')).toBeVisible()
    await expect(page.getByTestId('notification-hub')).toBeVisible()
    await expect(page.getByTestId('integration-probe-history')).toBeVisible()
    await expect(page.getByTestId('integration-probe-history-entry-0')).toBeVisible()
    await expect(page.getByTestId('integration-probe-history-supabase-0')).toHaveText(/supabase|онлайн|live/i)
    await expect(page.getByTestId('audit-coverage-summary')).toBeVisible()
    await expect(page.getByTestId('audit-coverage-summary')).toHaveText(/\d+.*(?:типов действий в журнале|action types in log).*\d+.*(?:локализованных меток|localized labels)/i)
  })

  test('probe history shows unreachable integration badges', async ({ page }) => {
    await page.addInitScript(() => {
      const entry = {
        checkedAt: '2020-01-01T00:00:00.000Z',
        results: {
          supabase: false,
          stripe: true,
          openai: null,
          email: null,
          sms: null,
          maps: null,
          observability: null,
        },
        summary: { live: 1, total: 2, unreachable: 1 },
      }
      localStorage.setItem('handymanos_integration_probe_history', JSON.stringify([entry]))
    })
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByTestId('integration-probe-history-supabase-1')).toHaveText(/недоступн|unreachable/i)
  })

  test('notification hub filters queued email and sms', async ({ page }) => {
    await page.evaluate(() => {
      const items = [
        {
          id: 'hub-e2e-email',
          to: 'email@test.com',
          subject: 'Email test',
          body: 'Body',
          channel: 'email',
          status: 'queued',
          attempts: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'hub-e2e-sms',
          to: '+15551234567',
          body: 'SMS test',
          channel: 'sms',
          status: 'queued',
          attempts: 0,
          created_at: new Date().toISOString(),
        },
      ]
      localStorage.setItem('handymanos_notification_queue', JSON.stringify(items))
    })
    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByTestId('notification-hub-item-hub-e2e-email')).toBeVisible()
    await expect(page.getByTestId('notification-hub-item-hub-e2e-sms')).toBeVisible()
    await page.getByTestId('notification-hub-filter-email').click()
    await expect(page.getByTestId('notification-hub-item-hub-e2e-email')).toBeVisible()
    await expect(page.getByTestId('notification-hub-item-hub-e2e-sms')).not.toBeVisible()
    await page.getByTestId('notification-hub-filter-sms').click()
    await expect(page.getByTestId('notification-hub-item-hub-e2e-sms')).toBeVisible()
    await expect(page.getByTestId('notification-hub-item-hub-e2e-email')).not.toBeVisible()
  })

  test('notification hub shows skipped opt-out log', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-004', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/estimates')
    await page.getByTestId('estimate-send-est-003').click()
    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })

    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await page.getByTestId('notification-hub-filter-skipped').click()
    await expect(page.getByText(/chen\.family@email\.com/i).first()).toBeVisible()
    await expect(page.getByText(/пропущено|skipped/i).first()).toBeVisible()
    await expect(page.getByText(/отключил email|opted out/i).first()).toBeVisible()
  })

  test('notification hub shows SMS opt-out skip from dispatch', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await clearNotificationQueue(page)
    await seedDraftJob(page, true)
    await page.goto('/dispatch')
    await page.getByTestId('dispatch-status-job-e2e-draft').click()
    await page.getByRole('option', { name: /запланирован|scheduled/i }).click()
    await expect(page.getByText(/SMS.*пропущено|SMS skipped|opt-out/i).first()).toBeVisible({ timeout: 5000 })

    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await page.getByTestId('notification-hub-filter-skipped').click()
    await expect(page.getByText(/555.*234.*5678|\(555\) 234-5678/).first()).toBeVisible()
    await expect(page.getByText(/отключил SMS|opted out of SMS/i).first()).toBeVisible()
  })

  test('notification hub exports and clears skip log', async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await page.evaluate(() => {
      localStorage.setItem('handymanos_customer_notify_prefs_cust-004', JSON.stringify({ email: false, sms: false }))
    })
    await page.goto('/estimates')
    await page.getByTestId('estimate-send-est-003').click()
    await expect(page.getByText(/email отключён|email disabled/i).first()).toBeVisible({ timeout: 5000 })

    await page.goto('/settings')
    await page.getByRole('tab', { name: /system|система/i }).click()
    await expect(page.getByTestId('notification-hub-export-skip-log')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('notification-hub-export-skip-log').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/handymanos-skip-log.*\.csv$/i)

    await page.getByTestId('notification-hub-clear-skip-log').click()
    await expect(page.getByText(/журнал пропусков очищен|skip log cleared/i).first()).toBeVisible({ timeout: 5000 })
    await page.getByTestId('notification-hub-filter-skipped').click()
    await expect(page.getByText(/chen\.family@email\.com/i)).not.toBeVisible()
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
