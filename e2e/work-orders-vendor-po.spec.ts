import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Work orders vendor PO', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('handymanos_vendor_pos', '[]')
      localStorage.setItem('handymanos_vendor_pos_seeded', 'true')
      localStorage.setItem('__e2e_supabase__vendor_po_records', '[]')
    })
    await loginAsOwner(page, 'ru')
  })

  test('vendor PO tab parses uploaded PDF and shows record in table', async ({ page }) => {
    await page.goto('/work-orders')

    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-sample.pdf')

    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('207872-02').first()).toBeVisible()
    await expect(page.getByText('350531955').first()).toBeVisible()
    await expect(page.getByText(/317 Main St/i).first()).toBeVisible()
  })

  test('Facil-IT Walgreens PO 210072-01 parses from user PDF fixture', async ({ page }) => {
    await page.goto('/work-orders')

    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-210072-01.pdf')

    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('210072-01').first()).toBeVisible()
    await expect(page.getByText('355708360').first()).toBeVisible()
    await expect(page.getByText(/3101 New Bern Ave/i).first()).toBeVisible()
  })

  test('create job from parsed vendor PO navigates to jobs list', async ({ page }) => {
    await page.goto('/work-orders')

    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles('e2e/fixtures/vendor-po-sample.pdf')
    await expect(page.getByText(/pdf успешно разобран|pdf parsed and saved/i).first()).toBeVisible({ timeout: 15000 })

    await page.getByTestId(/vendor-po-create-job-/).first().click()

    await expect(page).toHaveURL(/\/jobs/, { timeout: 10000 })
    await expect(page.getByText(/заказ создан из 207872-02|job created from 207872-02/i).first()).toBeVisible()
    await expect(page.getByText(/REPLACE:.*BUILDING INTERIOR/i).first()).toBeVisible()
  })

  test('multi-PDF batch upload parses two vendor PO records', async ({ page }) => {
    await page.goto('/work-orders')

    const dropzone = page.getByTestId('work-orders-vendor-po-dropzone')
    await dropzone.locator('input[type="file"]').setInputFiles([
      'e2e/fixtures/vendor-po-sample.pdf',
      'e2e/fixtures/vendor-po-emergency.pdf',
    ])

    await expect(page.getByText(/успешно разобран.*: 2|parsed and saved.*: 2/i).first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('vendor-po-record-count')).toHaveText('2', { timeout: 10000 })
    await expect(page.getByText('207872-02').first()).toBeVisible()
    await expect(page.getByText('210214-01').first()).toBeVisible()
  })
})
