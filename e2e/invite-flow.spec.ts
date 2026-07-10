import { test, expect } from '@playwright/test'

const INVITE_TOKEN = 'test-invite-token-phase19'

test.describe('Team invite flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('handymanos_team_invites', JSON.stringify([{
        id: 'inv-e2e',
        company_id: 'comp-001',
        email: 'tech-invite@test.com',
        role: 'technician',
        token,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      }]))
    }, INVITE_TOKEN)
  })

  test('technician invite signup redirects to mobile app', async ({ page }) => {
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
    await expect(page).toHaveURL(/\/tech/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /мои заказы|my jobs/i })).toBeVisible()
  })
})
