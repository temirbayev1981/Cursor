import { expect, type BrowserContext, type Page } from '@playwright/test'

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

/** Seeds an in-progress job assigned to the default demo technician (emp-001). */
export async function seedInProgressTechJob(page: Page, technicianId = 'emp-001') {
  await page.evaluate((techId) => {
    const jobs = JSON.parse(localStorage.getItem('handymanos_jobs') || '[]') as Array<Record<string, unknown>>
    const job = {
      id: 'job-e2e-tech-offline',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      property_id: 'prop-001',
      title: 'E2E Offline Tech Job',
      description: 'Initial field notes',
      status: 'in_progress',
      priority: 'medium',
      scheduled_date: new Date().toISOString(),
      assigned_technician_id: techId,
      estimated_hours: 2,
      actual_hours: 0,
      revenue: 300,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    const idx = jobs.findIndex((j) => j.id === 'job-e2e-tech-offline')
    if (idx >= 0) jobs[idx] = job
    else jobs.push(job)
    localStorage.setItem('handymanos_jobs', JSON.stringify(jobs))
  }, technicianId)
  await page.reload()
}

export async function clearOfflineQueue(page: Page) {
  await page.evaluate(() => localStorage.removeItem('handymanos_offline_queue'))
}

export async function setPageOffline(page: Page, context: BrowserContext) {
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
}

export async function setPageOnline(page: Page, context: BrowserContext) {
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
}
