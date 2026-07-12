import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth'
import { visibleRow, visibleTestId, visibleText } from './helpers/visibility'

test.describe('Materials inventory', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('shows low stock alert for materials below reorder level', async ({ page }) => {
    await page.goto('/materials')
    await expect(page.getByText(/предупреждение о низком запасе|low stock alert/i).first()).toBeVisible()
    await expect(visibleText(page, /Door Trim/i).first()).toBeVisible()
    await expect(page.getByText(/мало на складе|low stock/i).locator('visible=true').first()).toBeVisible()
  })

  test('receive stock dialog increases material quantity', async ({ page }) => {
    await page.goto('/materials')
    const row = visibleRow(page, 'Door Trim (8ft)')
    await expect(row).toContainText('3')

    await visibleTestId(page, 'material-receive-mat-003').click()
    await expect(page.getByTestId('materials-receive-dialog')).toBeVisible()
    await page.getByTestId('materials-receive-dialog').locator('input[type="number"]').fill('7')
    await page.getByTestId('materials-receive-submit').click()

    await expect(page.getByText(/приход на склад|receive stock/i).first()).toBeVisible({ timeout: 10000 })
    await expect(row).toContainText('10')
  })

  test('create material via form adds row to table', async ({ page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /добавить материал|add material/i }).click()
    await expect(page.getByTestId('material-form')).toBeVisible()

    const form = page.getByTestId('material-form')
    await form.locator('input').first().fill('E2E Copper Pipe')
    await form.locator('input').nth(1).fill('Plumbing')
    await form.locator('input').nth(2).fill('Ferguson')
    await form.locator('input[type="number"]').first().fill('12.50')
    await page.getByTestId('material-form-submit').click()

    await expect(page.getByText(/сохранить|saved/i).first()).toBeVisible({ timeout: 10000 })
    await expect(visibleText(page, 'E2E Copper Pipe').first()).toBeVisible()
  })
})
