import { test, expect } from '@playwright/test'

const INVITE_TOKEN = 'test-invite-token-phase19'

test.describe('Team invite flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      const invite = {
        id: 'inv-e2e',
        company_id: 'comp-001',
        email: 'tech-invite@test.com',
        role: 'technician',
        token,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      }
      localStorage.setItem('handymanos_team_invites', JSON.stringify([invite]))
      localStorage.setItem('__e2e_supabase__team_invites', JSON.stringify([invite]))
    }, INVITE_TOKEN)
  })

  test('technician invite signup completes lite onboarding', async ({ page }) => {
    await page.goto(`/login?invite=${INVITE_TOKEN}`)
    await expect(page.getByText(/пригласили|invited/i).first()).toBeVisible()
    await expect(page.getByText('technician')).toBeVisible()

    await page.locator('input[type="email"]').fill('tech-invite@test.com')
    await page.locator('input[type="password"]').fill('demo1234')
    const nameInput = page.locator('input').filter({ hasNot: page.locator('[type="email"], [type="password"]') })
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('Test Technician')
    }

    await page.getByRole('button', { name: /зарегистрироваться|sign up/i }).click()
    await expect(page).toHaveURL(/\/tech-onboarding/, { timeout: 10000 })
    await expect(page.getByText(/technician setup|настройка мастера/i).first()).toBeVisible()

    await page.locator('input').first().fill('Test Technician')
    await page.getByPlaceholder('(555)').fill('(555) 999-0000')
    await page.getByRole('button', { name: /далее|next/i }).click()
    await page.getByText('Plumbing').click()
    await page.getByRole('button', { name: /start working|начать работу/i }).click()

    await expect(page).toHaveURL(/\/tech/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /мои заказы|my jobs/i })).toBeVisible()
  })

  test('existing user signs in with invite to join another company', async ({ page }) => {
    const inviteToken = 'existing-user-invite-phase31'
    await page.addInitScript((token) => {
      const invite = {
        id: 'inv-existing',
        company_id: 'comp-002',
        email: 'owner@profixhandyman.com',
        role: 'dispatcher',
        token,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      }
      localStorage.setItem('handymanos_team_invites', JSON.stringify([invite]))
      localStorage.setItem('__e2e_supabase__team_invites', JSON.stringify([invite]))
      localStorage.setItem('handymanos_onboarding', 'complete')
    }, inviteToken)

    await page.goto(`/login?invite=${inviteToken}`)
    await expect(page.getByText(/пригласили|invited/i).first()).toBeVisible()

    await page.getByRole('tab', { name: /вход|sign in/i }).click()
    await page.locator('input[type="email"]').fill('owner@profixhandyman.com')
    await page.locator('input[type="password"]').fill('demo1234')
    await page.getByRole('button', { name: /войти|sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByRole('combobox')).toContainText(/Sunrise Property Services/i, { timeout: 5000 })
  })
})
