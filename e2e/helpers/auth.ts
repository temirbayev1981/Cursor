import { expect, type BrowserContext, type Page } from '@playwright/test'

export async function openCommandPalette(page: Page) {
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))
  })
}

export async function loginAsOwner(page: Page, locale: 'ru' | 'en' = 'ru') {
  await page.addInitScript((lang) => {
    localStorage.setItem('handymanos_locale', lang)
    localStorage.setItem('handymanos_onboarding', 'complete')
  }, locale)
  await page.goto('/login')
  await page.getByRole('button', { name: /войти|sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

/** Signs in as demo owner without completed onboarding — lands on wizard. */
export async function loginForOnboarding(page: Page, locale: 'ru' | 'en' = 'ru') {
  await page.addInitScript((lang) => {
    localStorage.setItem('handymanos_locale', lang)
    localStorage.removeItem('handymanos_onboarding')
    localStorage.removeItem('handymanos_onboarding_data')
  }, locale)
  await page.goto('/login')
  await page.getByRole('button', { name: /войти|sign in/i }).click()
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })
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
      ...(assignTech
        ? {
            assigned_technician_id: 'emp-002',
            scheduled_date: new Date().toISOString(),
          }
        : {}),
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

/** Seeds a scheduled job with property for route optimizer E2E. */
export async function seedScheduledRouteJob(page: Page) {
  await page.evaluate(() => {
    const jobs = JSON.parse(localStorage.getItem('handymanos_jobs') || '[]') as Array<Record<string, unknown>>
    const job = {
      id: 'job-e2e-scheduled-route',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      property_id: 'prop-001',
      title: 'E2E Scheduled Route Job',
      description: 'Route optimizer E2E test job',
      status: 'scheduled',
      priority: 'medium',
      scheduled_date: new Date().toISOString(),
      assigned_technician_id: 'emp-002',
      estimated_hours: 2,
      actual_hours: 0,
      revenue: 250,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    const idx = jobs.findIndex((j) => j.id === 'job-e2e-scheduled-route')
    if (idx >= 0) jobs[idx] = job
    else jobs.push(job)
    localStorage.setItem('handymanos_jobs', JSON.stringify(jobs))
  })
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

export async function clearNotificationQueue(page: Page) {
  await page.evaluate(() => localStorage.removeItem('handymanos_notification_queue'))
}

/** Seeds a draft invoice for send-flow E2E. */
export async function seedDraftInvoice(page: Page) {
  await page.evaluate(() => {
    const invoices = JSON.parse(localStorage.getItem('handymanos_invoices') || '[]') as Array<Record<string, unknown>>
    const invoice = {
      id: 'inv-e2e-draft',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      invoice_number: 'INV-E2E-DRAFT',
      status: 'draft',
      subtotal: 150,
      tax: 12.38,
      total: 162.38,
      amount_paid: 0,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
      line_items: [
        { id: 'li-e2e', description: 'E2E draft invoice service', quantity: 1, unit_price: 150, total: 150, type: 'service' },
      ],
      created_at: new Date().toISOString(),
    }
    const idx = invoices.findIndex((i) => i.id === 'inv-e2e-draft')
    if (idx >= 0) invoices[idx] = invoice
    else invoices.push(invoice)
    localStorage.setItem('handymanos_invoices', JSON.stringify(invoices))
  })
  await page.reload()
}

/** Seeds two draft jobs for bulk status E2E. */
export async function seedBulkDraftJobs(page: Page) {
  await page.evaluate(() => {
    const jobs = JSON.parse(localStorage.getItem('handymanos_jobs') || '[]') as Array<Record<string, unknown>>
    const base = {
      company_id: 'comp-001',
      description: 'Bulk actions E2E test job',
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
      status: 'draft',
    }
    const drafts = [
      { ...base, id: 'job-bulk-001', customer_id: 'cust-001', title: 'E2E Bulk Draft A' },
      { ...base, id: 'job-bulk-002', customer_id: 'cust-002', title: 'E2E Bulk Draft B' },
    ]
    for (const draft of drafts) {
      const idx = jobs.findIndex((j) => j.id === draft.id)
      if (idx >= 0) jobs[idx] = draft
      else jobs.push(draft)
    }
    localStorage.setItem('handymanos_jobs', JSON.stringify(jobs))
  })
  await page.reload()
}
