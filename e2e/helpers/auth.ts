import { expect, type BrowserContext, type Page } from '@playwright/test'

const E2E_PASSWORD = 'demo1234'
const E2E_OWNER_EMAIL = 'owner@profixhandyman.com'

export async function openCommandPalette(page: Page) {
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))
  })
}

const E2E_INIT_KEY = '__e2e_storage_init__'

function storageInitScript(lang: string, onboarding: 'complete' | 'fresh') {
  return `(() => {
    const initialized = sessionStorage.getItem('${E2E_INIT_KEY}')
    if (!initialized) {
      localStorage.clear()
      sessionStorage.clear()
      sessionStorage.setItem('${E2E_INIT_KEY}', '1')
    }
    localStorage.setItem('handymanos_locale', ${JSON.stringify(lang)})
    if (${JSON.stringify(onboarding)} === 'complete') {
      sessionStorage.removeItem('handymanos_e2e_onboarding_fresh')
      localStorage.setItem('handymanos_onboarding', 'complete')
    } else {
      sessionStorage.setItem('handymanos_e2e_onboarding_fresh', '1')
      localStorage.removeItem('handymanos_onboarding')
      localStorage.removeItem('handymanos_onboarding_data')
    }
  })()`
}

export async function loginAsOwner(page: Page, locale: 'ru' | 'en' = 'ru') {
  await page.addInitScript(storageInitScript(locale, 'complete'))
  await page.goto('/login')
  await page.locator('#email').fill(E2E_OWNER_EMAIL)
  await page.locator('#password').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /войти|sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

/** Signs in as owner without completed onboarding — lands on wizard. */
export async function loginForOnboarding(page: Page, locale: 'ru' | 'en' = 'ru') {
  await page.addInitScript(storageInitScript(locale, 'fresh'))
  await page.goto('/login')
  await page.locator('#email').fill(E2E_OWNER_EMAIL)
  await page.locator('#password').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /войти|sign in/i }).click()
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })
}

export async function setCustomerPortalSession(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('handymanos_portal_session', JSON.stringify({
      customerId: 'cust-002',
      companyId: 'comp-001',
      portalType: 'customer',
      customerName: 'Sarah Johnson',
      expiresAt: Date.now() + 30 * 86400000,
      token: 'e2e-portal-customer-token',
    }))
  })
}

export async function setPropertyPortalSession(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('handymanos_portal_session', JSON.stringify({
      customerId: 'cust-001',
      companyId: 'comp-001',
      portalType: 'property',
      customerName: 'ABC Property Management',
      expiresAt: Date.now() + 30 * 86400000,
      token: 'e2e-portal-property-token',
    }))
  })
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
    const dbJobs = JSON.parse(localStorage.getItem('__e2e_supabase__jobs') || '[]') as Array<Record<string, unknown>>
    const dbIdx = dbJobs.findIndex((j) => j.id === 'job-e2e-draft')
    if (dbIdx >= 0) dbJobs[dbIdx] = draft
    else dbJobs.push(draft)
    localStorage.setItem('__e2e_supabase__jobs', JSON.stringify(dbJobs))
  }, withTechnician)
  await page.reload()
}

/** Seeds an in-progress job assigned to the default technician (emp-001). */
export async function seedInProgressTechJob(page: Page, technicianId = 'emp-001') {
  await page.evaluate((techId) => {
    const linkProfileId = 'user-001'
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
    const dbJobs = JSON.parse(localStorage.getItem('__e2e_supabase__jobs') || '[]') as Array<Record<string, unknown>>
    const dbIdx = dbJobs.findIndex((j) => j.id === 'job-e2e-tech-offline')
    if (dbIdx >= 0) dbJobs[dbIdx] = job
    else dbJobs.push(job)
    localStorage.setItem('__e2e_supabase__jobs', JSON.stringify(dbJobs))

    for (const key of ['handymanos_employees', '__e2e_supabase__employees']) {
      const employees = JSON.parse(localStorage.getItem(key) || '[]') as Array<Record<string, unknown>>
      const empIdx = employees.findIndex((e) => e.id === techId)
      if (empIdx >= 0) {
        employees[empIdx] = { ...employees[empIdx], profile_id: linkProfileId }
        localStorage.setItem(key, JSON.stringify(employees))
      }
    }
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
    localStorage.setItem('__e2e_supabase__jobs', JSON.stringify(jobs))
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
    localStorage.setItem('__e2e_supabase__invoices', JSON.stringify(invoices))
  })
  await page.reload()
}

/** Seeds two draft jobs for bulk status E2E. */
/** Resets a demo estimate status in localStorage for portal E2E isolation. */
export async function resetEstimateStatus(page: Page, estimateId: string, status: string) {
  await page.evaluate(({ id, nextStatus }) => {
    const estimates = JSON.parse(localStorage.getItem('handymanos_estimates') || '[]') as Array<Record<string, unknown>>
    const idx = estimates.findIndex((e) => e.id === id)
    if (idx >= 0) estimates[idx] = { ...estimates[idx], status: nextStatus }
    localStorage.setItem('handymanos_estimates', JSON.stringify(estimates))
    localStorage.setItem('__e2e_supabase__estimates', JSON.stringify(estimates))
  }, { id: estimateId, nextStatus: status })
}

/** Seeds an on-hold job for jobs filter tab E2E. */
export async function seedOnHoldJob(page: Page) {
  await page.evaluate(() => {
    const jobs = JSON.parse(localStorage.getItem('handymanos_jobs') || '[]') as Array<Record<string, unknown>>
    const job = {
      id: 'job-e2e-on-hold',
      company_id: 'comp-001',
      customer_id: 'cust-001',
      title: 'E2E On Hold Job',
      description: 'On-hold filter tab E2E test job',
      status: 'on_hold',
      priority: 'low',
      estimated_hours: 3,
      actual_hours: 0,
      revenue: 180,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    }
    const idx = jobs.findIndex((j) => j.id === 'job-e2e-on-hold')
    if (idx >= 0) jobs[idx] = job
    else jobs.push(job)
    localStorage.setItem('handymanos_jobs', JSON.stringify(jobs))
    localStorage.setItem('__e2e_supabase__jobs', JSON.stringify(jobs))
  })
  await page.reload()
}

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
    localStorage.setItem('__e2e_supabase__jobs', JSON.stringify(jobs))
  })
  await page.reload()
}

/** Clears demo portal review flag so review E2E can run again. */
export async function clearPortalReview(page: Page, customerId = 'cust-002') {
  await page.evaluate((id) => {
    localStorage.removeItem(`handymanos_portal_review_${id}`)
  }, customerId)
}

/** Seeds unpaid invoice for demo customer portal (cust-002). */
export async function seedPortalCustomerInvoice(page: Page) {
  await page.evaluate(() => {
    const invoices = JSON.parse(localStorage.getItem('handymanos_invoices') || '[]') as Array<Record<string, unknown>>
    const invoice = {
      id: 'inv-portal-e2e',
      company_id: 'comp-001',
      customer_id: 'cust-002',
      invoice_number: 'INV-PORTAL-E2E',
      status: 'sent',
      subtotal: 300,
      tax: 24.75,
      total: 324.75,
      amount_paid: 0,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
      line_items: [
        { id: 'li-portal-e2e', description: 'Portal E2E service', quantity: 1, unit_price: 300, total: 300, type: 'service' },
      ],
      created_at: new Date().toISOString(),
    }
    const idx = invoices.findIndex((i) => i.id === 'inv-portal-e2e')
    if (idx >= 0) invoices[idx] = invoice
    else invoices.push(invoice)
    localStorage.setItem('handymanos_invoices', JSON.stringify(invoices))
    localStorage.setItem('__e2e_supabase__invoices', JSON.stringify(invoices))
  })
  await page.reload()
}

export async function openSettingsAuditTab(page: Page) {
  await page.goto('/settings')
  await page.getByRole('tab', { name: /system|система/i }).click()
  await expect(page.getByTestId('audit-log-list')).toBeVisible()
}
