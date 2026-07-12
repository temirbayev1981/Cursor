import { test, expect, type Page } from '@playwright/test'
import { loginAsOwner, seedDraftJob, seedScheduledRouteJob } from './helpers/auth'
import { visibleText } from './helpers/visibility'

async function dragDispatchCard(page: Page, cardTestId: string, targetColumnTestId: string) {
  const card = page.getByTestId(cardTestId)
  const target = page.getByTestId(targetColumnTestId)
  const cardBox = await card.boundingBox()
  const targetBox = await target.boundingBox()
  if (!cardBox || !targetBox) throw new Error('Missing drag target bounds')

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 24)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 80, { steps: 12 })
  await page.mouse.up()
}

test.describe('Dispatch drag-and-drop', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedDraftJob(page)
  })

  test('drag draft job to scheduled column updates status', async ({ page }) => {
    await page.goto('/dispatch')
    const card = page.getByTestId('dispatch-card-job-e2e-draft')
    await expect(card).toBeVisible()
    await expect(page.getByTestId('dispatch-column-draft')).toContainText('E2E Draft Job for Scheduling')

    await dragDispatchCard(page, 'dispatch-card-job-e2e-draft', 'dispatch-column-scheduled')

    await expect(page.getByTestId('dispatch-column-scheduled')).toContainText('E2E Draft Job for Scheduling', { timeout: 10000 })
    await expect(page.getByTestId('dispatch-column-draft')).not.toContainText('E2E Draft Job for Scheduling', { timeout: 10000 })
    await expect(
      page.getByTestId('dispatch-column-scheduled').getByTestId('dispatch-status-job-e2e-draft'),
    ).toContainText(/запланирован|scheduled/i)
  })
})

test.describe('Dispatch route optimizer', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
    await seedScheduledRouteJob(page)
  })

  test('route optimizer panel shows stops and open maps link', async ({ page }) => {
    await page.goto('/dispatch')
    const panel = page.getByTestId('route-optimizer-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText(/оптимизация маршрута|route optimization/i).first()).toBeVisible()
    await expect(visibleText(page, 'E2E Scheduled Route Job', true).first()).toBeVisible()
    await expect(panel.getByRole('link', { name: /google maps/i })).toBeVisible()
    await expect(panel.locator('a[href*="google"]').first()).toHaveAttribute('href', /google\.com\/maps/)
  })
})

test.describe('AI assistant chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('send custom question via input shows user bubble and assistant reply', async ({ page }) => {
    await page.goto('/ai-assistant')
    await expect(page.getByTestId('ai-chat-assistant-message').first()).toBeVisible()

    const question = 'Какой мастер самый прибыльный?'
    await page.getByTestId('ai-chat-input').fill(question)
    await page.getByTestId('ai-chat-submit').click()

    await expect(page.getByTestId('ai-chat-user-message')).toContainText(question)
    await expect(page.getByText(/James Rodriguez|Marcus Thompson/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/прибыль|margin|маржа/i).first()).toBeVisible()
  })

  test('suggested question buttons trigger assistant response', async ({ page }) => {
    await page.goto('/ai-assistant')
    await page.getByTestId('ai-suggested-question').filter({ hasText: /замену двери|replacing a door/i }).click()
    await expect(page.getByText(/\$325|\$385|325/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Reports PDF export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page, 'ru')
  })

  test('export PDF opens report preview window', async ({ page }) => {
    await page.goto('/reports')
    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('reports-export-pdf').click()
    const popup = await popupPromise
    await expect(popup.locator('h1')).toContainText(/отчёты|reports/i)
    await expect(popup.locator('body')).toContainText(/выручка|revenue/i)
    await popup.close()
  })
})
