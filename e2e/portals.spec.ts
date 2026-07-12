import { test, expect } from '@playwright/test'
import { visibleText } from './helpers/visibility'
import { clearPortalReview, setCustomerPortalSession, setPropertyPortalSession } from './helpers/auth'

test.describe('Portals', () => {
  test.beforeEach(async ({ page }) => {
    await setCustomerPortalSession(page)
  })

  test('customer portal review submission', async ({ page }) => {
    await page.goto('/portal/customer')
    await clearPortalReview(page)
    await page.reload()
    await page.getByRole('button', { name: /оставить отзыв|leave a review/i }).click()
    await page.getByRole('button', { name: '5' }).click()
    await page.locator('#portal-review-comment').fill('Excellent service, very professional.')
    await page.getByRole('button', { name: /отправить отзыв|submit review/i }).click()
    await expect(visibleText(page, /спасибо за отзыв|thank you for your review/i).first()).toBeVisible({ timeout: 5000 })
    await expect(visibleText(page, /уже оставили отзыв|already left a review/i)).toBeVisible()
  })

  test('customer portal shows estimates and approve action', async ({ page }) => {
    await page.goto('/portal/customer')
    await expect(page.getByRole('heading', { name: /клиентский портал|customer portal/i })).toBeVisible()
    await expect(visibleText(page, /Bathroom Fixture|замен/i).first()).toBeVisible()
    const approveBtn = page.getByTestId('portal-estimate-approve-est-004')
    await expect(approveBtn).toBeVisible()
    await approveBtn.click()
    await expect(visibleText(page, /утверждена|approved/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('customer portal shows SMS opt-out badge by default', async ({ page }) => {
    await page.goto('/portal/customer')
    await expect(page.getByTestId('customer-portal-notification-prefs')).toBeVisible()
    await expect(page.getByTestId('customer-portal-sms-optout-badge')).toBeVisible()
    await expect(page.getByTestId('customer-portal-email-optout-badge')).not.toBeVisible()
  })

  test('customer portal shows email opt-out badge when disabled', async ({ page }) => {
    await page.goto('/portal/customer')
    const emailToggle = page.getByTestId('customer-portal-notify-email')
    if ((await emailToggle.getAttribute('data-state')) === 'checked') {
      await emailToggle.click()
      await expect(visibleText(page, /настройки уведомлений сохранены|notification preferences saved/i).first()).toBeVisible({ timeout: 5000 })
    }
    await expect(page.getByTestId('customer-portal-email-optout-badge')).toBeVisible()
  })

  test('customer portal declines sent estimate', async ({ page }) => {
    await page.goto('/portal/customer')
    await expect(page.getByTestId('portal-estimate-decline-est-004')).toBeVisible()
    await page.getByTestId('portal-estimate-decline-est-004').click()
    await expect(visibleText(page, /отклонена|declined|rejected/i).first()).toBeVisible({ timeout: 5000 })
    await expect(visibleText(page, /отклонена|rejected/i).first()).toBeVisible()
  })

  test('property portal submit request form', async ({ page }) => {
    await setPropertyPortalSession(page)
    await page.goto('/portal/property')
    await expect(page.getByRole('heading', { name: /портал управляющей|property manager portal/i })).toBeVisible()
    await page.getByRole('button', { name: /подать заявку|submit request/i }).click()
    await page.locator('input').first().fill('HVAC maintenance - lobby')
    await page.locator('textarea').first().fill('Air conditioning unit needs inspection and filter replacement')
    await page.getByRole('button', { name: /сохранить|save/i }).click()
    await expect(visibleText(page, /заявка отправлена|request submitted/i).first()).toBeVisible({ timeout: 5000 })
    await expect(visibleText(page, 'HVAC maintenance - lobby')).toBeVisible()
  })
})

test.describe('Portal magic link', () => {
  const PORTAL_TOKEN = 'e2e-portal-customer-token'

  test('portal access page validates token and redirects', async ({ page }) => {
    await page.goto(`/portal/access?token=${PORTAL_TOKEN}`)
    await expect(page).toHaveURL(/\/portal\/customer/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /клиентский портал|customer portal/i })).toBeVisible()
  })

  test('portal access page shows English errors for invalid token', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_locale', 'en')
    })
    await page.goto('/portal/access?token=invalid-token-phase40')
    await expect(page.getByRole('alert')).toContainText(/expired|invalid/i)
    await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
  })

  test('portal access page shows English error when token is missing', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_locale', 'en')
    })
    await page.goto('/portal/access')
    await expect(page.getByRole('alert')).toContainText(/invalid link/i)
    await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
  })
})

test.describe('Portal access errors', () => {
  test('shows invalid link when token is missing', async ({ page }) => {
    await page.goto('/portal/access')
    await expect(page.getByRole('alert')).toContainText(/ссылка недействительна|invalid link/i)
    await expect(page.getByRole('link', { name: /вернуться ко входу|back to login/i })).toBeVisible()
  })

  test('shows expired link for unknown token', async ({ page }) => {
    await page.goto('/portal/access?token=invalid-token-phase40')
    await expect(page.getByRole('alert')).toContainText(/истекл|expired|invalid/i)
  })
})
