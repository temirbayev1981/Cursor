import { test, expect } from '@playwright/test'
import { visibleText } from './helpers/visibility'
import { loginAsOwner } from './helpers/auth'

test.describe('HandymanOS AI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('dashboard loads with stat cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /панель руководителя|executive dashboard/i })).toBeVisible()
  })

  test('vendor PO tab on work orders', async ({ page }) => {
    await page.goto('/work-orders')
    await expect(visibleText(page, /Vendor PO/i).first()).toBeVisible()
  })

  test('invoices page shows outstanding', async ({ page }) => {
    await page.goto('/invoices')
    await expect(visibleText(page, /к оплате|outstanding/i).first()).toBeVisible()
  })
})
