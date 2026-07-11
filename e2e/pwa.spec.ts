import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('PWA assets', () => {
  test('manifest and service worker are served', async ({ request }) => {
    const manifest = await request.get('/manifest.json')
    expect(manifest.ok()).toBeTruthy()
    const body = await manifest.json()
    expect(body.name).toMatch(/HandymanOS/i)

    const sw = await request.get('/sw.js')
    expect(sw.ok()).toBeTruthy()
    const swText = await sw.text()
    expect(swText).toContain('handymanos-v4')
  })

  test('service worker registers after page load', async ({ page }) => {
    await loginAsOwner(page)
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const reg = await navigator.serviceWorker.getRegistration()
      return Boolean(reg?.active)
    })
    expect(registered).toBe(true)
  })
})
