import { test, expect } from '@playwright/test'

test.describe('Portals', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('handymanos_portal_token', 'demo')
    })
  })

  test('customer portal review submission', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('handymanos_portal_review_cust-002')
    })
    await page.goto('/portal/customer')
    await page.getByRole('button', { name: /оставить отзыв|leave a review/i }).click()
    await page.getByRole('button', { name: '5' }).click()
    await page.locator('#portal-review-comment').fill('Excellent service, very professional.')
    await page.getByRole('button', { name: /отправить отзыв|submit review/i }).click()
    await expect(page.getByText(/спасибо за отзыв|thank you for your review/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/уже оставили отзыв|already left a review/i)).toBeVisible()
  })

  test('customer portal shows estimates and approve action', async ({ page }) => {
    await page.goto('/portal/customer')
    await expect(page.getByRole('heading', { name: /клиентский портал|customer portal/i })).toBeVisible()
    await expect(page.getByText(/Bathroom Fixture|замен/i).first()).toBeVisible()
    const approveBtn = page.getByRole('button', { name: /утвердить|approve/i }).first()
    await expect(approveBtn).toBeVisible()
    await approveBtn.click()
    await expect(page.getByText(/утверждена|approved/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('property portal submit request form', async ({ page }) => {
    await page.goto('/portal/property')
    await expect(page.getByRole('heading', { name: /портал управляющей|property manager portal/i })).toBeVisible()
    await page.getByRole('button', { name: /подать заявку|submit request/i }).click()
    await page.locator('input').first().fill('HVAC maintenance - lobby')
    await page.locator('textarea').first().fill('Air conditioning unit needs inspection and filter replacement')
    await page.getByRole('button', { name: /сохранить|save/i }).click()
    await expect(page.getByText(/заявка отправлена|request submitted/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('HVAC maintenance - lobby')).toBeVisible()
  })
})

test.describe('Portal magic link', () => {
  const PORTAL_TOKEN = 'test-portal-token-phase19'

  test('portal access page validates token and redirects', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('handymanos_portal_tokens', JSON.stringify([{
        id: 'pt-e2e',
        company_id: 'comp-001',
        customer_id: 'cust-001',
        portal_type: 'customer',
        token,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      }]))
    }, PORTAL_TOKEN)

    await page.goto(`/portal/access?token=${PORTAL_TOKEN}`)
    await expect(page).toHaveURL(/\/portal\/customer/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /клиентский портал|customer portal/i })).toBeVisible()
  })
})
