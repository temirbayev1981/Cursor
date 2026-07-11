import { test, expect } from '@playwright/test'

const hasSupabaseCreds = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
const skipLive = process.env.LIVE_E2E_OPTIONAL === '1' && !hasSupabaseCreds

test.describe('Live backend smoke', () => {
  test.skip(skipLive, 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required for live E2E')

  test('login page loads against live Supabase', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|войти/i })).toBeVisible()
  })

  test('app shell does not show Supabase required screen', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/supabase required/i)).not.toBeVisible()
  })

  test('unauthenticated visit redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('instructions page loads user guide', async ({ page }) => {
    await page.goto('/instructions')
    await expect(page.getByRole('heading', { name: /руководство пользователя|user guide/i }).first()).toBeVisible()
    await expect(page.locator('.instructions-doc')).toBeVisible({ timeout: 15000 })
  })

  test('login page links to instructions', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /руководство|user guide|instructions/i })).toBeVisible()
  })

  test('static PWA and guide assets are served', async ({ request }) => {
    for (const path of ['/INSTRUCTIONS.en.md', '/manifest.json', '/sw.js']) {
      const response = await request.get(path)
      expect(response.ok(), `${path} should return 200`).toBeTruthy()
      const body = await response.text()
      expect(body.length).toBeGreaterThan(0)
    }
  })

  test('english instructions asset contains user guide heading', async ({ request }) => {
    const response = await request.get('/INSTRUCTIONS.en.md')
    expect(response.ok()).toBeTruthy()
    const text = await response.text()
    expect(text).toMatch(/user guide/i)
  })
})
