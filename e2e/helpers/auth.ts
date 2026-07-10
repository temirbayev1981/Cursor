import { expect, type Page } from '@playwright/test'

export async function loginAsOwner(page: Page, locale: 'ru' | 'en' = 'ru') {
  await page.addInitScript((lang) => {
    localStorage.setItem('handymanos_locale', lang)
    localStorage.setItem('handymanos_onboarding', 'complete')
  }, locale)
  await page.goto('/login')
  await page.getByRole('button', { name: /войти|sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

export async function seedDraftJob(page: Page, withTechnician = false) {
  await page.evaluate((assignTech) => {
    const jobs = JSON.parse(localStorage.getItem('handymanos_jobs') || '[]') as Array<Record<string, unknown>>
    const draft = {
      id: 'job-e2e-draft',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'E2E Draft Job for Scheduling',
      description: 'Notification E2E test job',
      status: 'draft',
      priority: 'medium',
      estimated_hours: 2,
      actual_hours: 0,
      revenue: 200,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
      ...(assignTech ? { assigned_technician_id: 'emp-002' } : {}),
    }
    const idx = jobs.findIndex((j) => j.id === 'job-e2e-draft')
    if (idx >= 0) jobs[idx] = draft
    else jobs.push(draft)
    localStorage.setItem('handymanos_jobs', JSON.stringify(jobs))
  }, withTechnician)
  await page.reload()
}
