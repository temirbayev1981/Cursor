import { expect, type Locator, type Page } from '@playwright/test'

/** Assert text is visible when duplicate nodes exist (e.g. mobile + desktop layouts). */
export function visibleText(page: Page, text: string | RegExp, exact = false): Locator {
  return page.getByText(text, { exact }).locator('visible=true')
}

export function visibleTestId(page: Page, testId: string): Locator {
  return page.getByTestId(testId).locator('visible=true')
}

export function visibleTestIdMatch(page: Page, pattern: RegExp): Locator {
  return page.getByTestId(pattern).locator('visible=true')
}

export function visibleCommandPalette(page: Page): Locator {
  return page.getByTestId('command-palette').locator('visible=true')
}

export async function expectVisibleText(
  page: Page,
  text: string,
  options?: { exact?: boolean; timeout?: number },
): Promise<void> {
  const { exact = false, timeout = 10_000 } = options ?? {}
  await expect(visibleText(page, text, exact).first()).toBeVisible({ timeout })
}

/** Jobs page renders mobile cards and a desktop table with the same titles. */
export async function expectJobTitleVisible(
  page: Page,
  title: string,
  options?: { timeout?: number },
): Promise<void> {
  await expectVisibleText(page, title, { exact: true, timeout: options?.timeout })
}

export async function expectEstimateTitleVisible(
  page: Page,
  title: string,
  options?: { timeout?: number },
): Promise<void> {
  await expectVisibleText(page, title, { exact: true, timeout: options?.timeout })
}

export function visibleRow(page: Page, text: string | RegExp): Locator {
  return page.getByRole('row').filter({ hasText: text }).locator('visible=true')
}
