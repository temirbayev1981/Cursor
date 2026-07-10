import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'

test.describe('Properties & job inventory', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('properties page shows demo property cards', async ({ page }) => {
    await page.goto('/properties')
    await expect(page.getByRole('heading', { name: /объекты|properties/i })).toBeVisible()
    await expect(page.getByText('Riverside Apartments - Unit 204').first()).toBeVisible()
    await expect(page.getByText(/ABC Property Management/i).first()).toBeVisible()
  })

  test('create property via form adds card', async ({ page }) => {
    await page.goto('/properties')
    await page.getByRole('button', { name: /добавить объект|add property/i }).click()
    await expect(page.getByTestId('property-form')).toBeVisible()

    const form = page.getByTestId('property-form')
    await form.locator('input').first().fill('E2E Test Property')
    await form.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /ABC Property Management/i }).click()
    await form.locator('input').nth(1).fill('200 E2E Street, Austin, TX')
    await page.getByTestId('property-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('E2E Test Property').first()).toBeVisible()
  })

  test('deduct job materials updates inventory quantity', async ({ page }) => {
    await page.goto('/materials')
    const materialRow = page.getByRole('row').filter({ hasText: 'Joint Compound (5 gal)' })
    const qtyBefore = await materialRow.locator('td').nth(3).textContent()

    await page.goto('/jobs')
    await page.getByTestId('job-material-usage-job-001').click()
    await expect(page.getByTestId('job-material-dialog')).toBeVisible()
    await page.getByTestId('job-material-dialog').getByRole('combobox').click()
    await page.getByRole('option', { name: /Joint Compound/i }).click()
    await page.getByTestId('job-material-submit').click()

    await expect(page.getByText(/материалы списаны|materials deducted/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/materials')
    const qtyAfter = await page.getByRole('row').filter({ hasText: 'Joint Compound (5 gal)' }).locator('td').nth(3).textContent()
    expect(Number.parseInt(qtyAfter ?? '0', 10)).toBe(Number.parseInt(qtyBefore ?? '0', 10) - 1)
  })
})
