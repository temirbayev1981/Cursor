import type { VendorPORecord } from '@/types/vendor-po'
import { getProblemDescriptionEn, getProblemDescriptionRu } from '@/lib/vendor-po-problem'

export { groupVendorPOsByAddress } from '@/lib/vendor-po-groups'
import type { Job, Employee, Estimate, Invoice } from '@/types'
import type { CustomerReportSummary } from '@/services/entity-service'
import type { ChartDataPoint } from '@/lib/analytics'
import { computeTechnicianPerformance, computeServiceProfitability, computeReportSummary } from '@/lib/analytics'

type XlsxModule = typeof import('xlsx')

let xlsxReady: Promise<XlsxModule> | null = null

async function getXlsx(): Promise<XlsxModule> {
  xlsxReady ??= import('xlsx')
  return xlsxReady
}

export async function exportVendorPOsToExcel(records: VendorPORecord[], filename = 'vendor-po-export.xlsx') {
  const XLSX = await getXlsx()
  const rows = records.map((r) => ({
    '№ наряда': r.vendor_po_number,
    '№ клиента': r.client_po_number,
    'Приоритет': r.priority,
    'Тип': r.order_type,
    'NTE ($)': r.nte_amount,
    'Объект': r.service_location_name,
    'Loc #': r.location_number ?? '',
    'Адрес': r.service_address,
    'Город': r.service_city,
    'Штат': r.service_state,
    'ZIP': r.service_zip,
    'Телефон': r.service_phone,
    'Описание проблемы': getProblemDescriptionRu(r) || getProblemDescriptionEn(r),
    'Объём работ': r.work_summary,
    'Категория': r.service_category,
    'Заказчик': r.client_company,
    'Контакт': r.client_contact,
    'Email': r.client_email,
    'Файл': r.source_file_name,
    'Дата': r.created_at,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Vendor PO')
  XLSX.writeFile(wb, filename)
}

export async function exportJobsToCsv(jobs: import('@/types').Job[], filename = 'jobs-report.csv') {
  const XLSX = await getXlsx()
  const rows = jobs.map((j) => ({
    Title: j.title,
    Status: j.status,
    Priority: j.priority,
    Revenue: j.revenue,
    Profit: j.profit,
    'Profit %': j.profit_margin,
    'Est. Hours': j.estimated_hours,
    Created: j.created_at,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Jobs')
  XLSX.writeFile(wb, filename)
}

export async function exportFinancialReport(
  jobs: Job[],
  customers: CustomerReportSummary[],
  filename = 'financial-report.xlsx'
) {
  await exportFullReport(jobs, customers, [], filename)
}

export interface ReportPdfLabels {
  jobs: string
  revenue: string
  profit: string
  margin: string
  revenueByMonth: string
  month: string
  technicianPerformance: string
  name: string
  efficiency: string
  serviceProfitability: string
  service: string
  customers: string
  customer: string
  jobProfitability: string
  job: string
  costs: string
  expenseBreakdown: string
  category: string
  amount: string
}

export interface ReportPdfData {
  title: string
  dateRangeLabel: string
  activeTab: string
  summary: ReturnType<typeof computeReportSummary>
  revenueChart?: ChartDataPoint[]
  technicians?: ChartDataPoint[]
  services?: ChartDataPoint[]
  customers?: CustomerReportSummary[]
  profitJobs?: Array<{
    title: string
    customer: string
    revenue: number
    costs: number
    profit: number
    margin: number
  }>
  expenses?: ChartDataPoint[]
  labels: ReportPdfLabels
}

export async function exportFullReport(
  jobs: Job[],
  customers: CustomerReportSummary[],
  employees: Employee[],
  filename = 'handymanos-report.xlsx'
) {
  const XLSX = await getXlsx()
  const jobRows = jobs.map((j) => {
    const customer = customers.find((c) => c.id === j.customer_id)
    return {
      Job: j.title,
      Customer: customer?.name ?? '',
      Revenue: j.revenue,
      Profit: j.profit,
      'Profit %': j.profit_margin,
      Status: j.status,
      Date: j.completed_date ?? j.scheduled_date ?? j.created_at,
    }
  })

  const techRows = computeTechnicianPerformance(jobs, employees).map((row) => ({
    Technician: row.name,
    Revenue: row.revenue ?? 0,
    Jobs: row.jobs ?? 0,
    Efficiency: row.efficiency ?? 0,
  }))

  const serviceRows = computeServiceProfitability(jobs).map((row) => ({
    Service: row.name,
    Profit: row.profit ?? 0,
    Jobs: row.jobs ?? 0,
  }))

  const customerRows = customers.map((c) => ({
    Customer: c.name,
    Revenue: c.total_revenue,
    Jobs: c.job_count,
    Type: c.type,
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jobRows), 'Financial')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(techRows), 'Technicians')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviceRows), 'Services')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customerRows), 'Customers')
  XLSX.writeFile(wb, filename)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function exportReportPdf(data: ReportPdfData) {
  const { labels } = data
  const rows: string[] = []

  if (data.revenueChart?.length) {
    rows.push(`<h2>${escapeHtml(labels.revenueByMonth)}</h2><table><tr><th>${escapeHtml(labels.month)}</th><th>${escapeHtml(labels.revenue)}</th><th>${escapeHtml(labels.profit)}</th></tr>`)
    for (const row of data.revenueChart) {
      rows.push(`<tr><td>${escapeHtml(row.name)}</td><td>$${(row.revenue ?? 0).toFixed(2)}</td><td>$${(row.profit ?? 0).toFixed(2)}</td></tr>`)
    }
    rows.push('</table>')
  }

  if (data.technicians?.length) {
    rows.push(`<h2>${escapeHtml(labels.technicianPerformance)}</h2><table><tr><th>${escapeHtml(labels.name)}</th><th>${escapeHtml(labels.revenue)}</th><th>${escapeHtml(labels.jobs)}</th><th>${escapeHtml(labels.efficiency)}</th></tr>`)
    for (const row of data.technicians) {
      rows.push(`<tr><td>${escapeHtml(row.name)}</td><td>$${(row.revenue ?? 0).toFixed(2)}</td><td>${row.jobs ?? 0}</td><td>${row.efficiency ?? 0}%</td></tr>`)
    }
    rows.push('</table>')
  }

  if (data.services?.length) {
    rows.push(`<h2>${escapeHtml(labels.serviceProfitability)}</h2><table><tr><th>${escapeHtml(labels.service)}</th><th>${escapeHtml(labels.profit)}</th><th>${escapeHtml(labels.jobs)}</th></tr>`)
    for (const row of data.services) {
      rows.push(`<tr><td>${escapeHtml(row.name)}</td><td>$${(row.profit ?? 0).toFixed(2)}</td><td>${row.jobs ?? 0}</td></tr>`)
    }
    rows.push('</table>')
  }

  if (data.customers?.length) {
    rows.push(`<h2>${escapeHtml(labels.customers)}</h2><table><tr><th>${escapeHtml(labels.customer)}</th><th>${escapeHtml(labels.revenue)}</th><th>${escapeHtml(labels.jobs)}</th></tr>`)
    for (const customer of data.customers) {
      rows.push(`<tr><td>${escapeHtml(customer.name)}</td><td>$${customer.total_revenue.toFixed(2)}</td><td>${customer.job_count}</td></tr>`)
    }
    rows.push('</table>')
  }

  if (data.profitJobs?.length) {
    rows.push(`<h2>${escapeHtml(labels.jobProfitability)}</h2><table><tr><th>${escapeHtml(labels.job)}</th><th>${escapeHtml(labels.customer)}</th><th>${escapeHtml(labels.revenue)}</th><th>${escapeHtml(labels.costs)}</th><th>${escapeHtml(labels.profit)}</th><th>${escapeHtml(labels.margin)}</th></tr>`)
    for (const row of data.profitJobs) {
      rows.push(`<tr><td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.customer)}</td><td>$${row.revenue.toFixed(2)}</td><td>$${row.costs.toFixed(2)}</td><td>$${row.profit.toFixed(2)}</td><td>${row.margin}%</td></tr>`)
    }
    rows.push('</table>')
  }

  if (data.expenses?.length) {
    rows.push(`<h2>${escapeHtml(labels.expenseBreakdown)}</h2><table><tr><th>${escapeHtml(labels.category)}</th><th>${escapeHtml(labels.amount)}</th></tr>`)
    for (const row of data.expenses) {
      rows.push(`<tr><td>${escapeHtml(row.name)}</td><td>$${(row.value ?? 0).toFixed(2)}</td></tr>`)
    }
    rows.push('</table>')
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .summary div { background: #f4f4f5; padding: 12px 16px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.title)}</h1>
  <p class="meta">${escapeHtml(data.dateRangeLabel)} · ${escapeHtml(data.activeTab)}</p>
  <div class="summary">
    <div><strong>${escapeHtml(labels.jobs)}</strong><br>${data.summary.jobs}</div>
    <div><strong>${escapeHtml(labels.revenue)}</strong><br>$${data.summary.revenue.toFixed(2)}</div>
    <div><strong>${escapeHtml(labels.profit)}</strong><br>$${data.summary.profit.toFixed(2)}</div>
    <div><strong>${escapeHtml(labels.margin)}</strong><br>${data.summary.margin}%</div>
  </div>
  ${rows.join('\n')}
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export interface PdfTableLabels {
  lineItems: string
  description: string
  qty: string
  unit: string
  total: string
  noLineItems: string
}

export interface EstimatePdfLabels extends PdfTableLabels {
  labor: string
  materials: string
  validUntil: string
  laborHoursSuffix: string
  perHour: string
}

export interface EstimatePdfData {
  title: string
  customerName: string
  status: string
  laborHours: number
  laborRate: number
  materialCost: number
  total: number
  validUntil: string
  lineItems: Estimate['line_items']
  companyName?: string
  labels: EstimatePdfLabels
}

export function exportEstimatePdf(data: EstimatePdfData) {
  const { labels } = data
  const lineRows = data.lineItems.length
    ? data.lineItems.map((item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>$${item.unit_price.toFixed(2)}</td><td>$${item.total.toFixed(2)}</td></tr>`,
      ).join('\n')
    : `<tr><td colspan="4">${escapeHtml(labels.noLineItems)}</td></tr>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary div { background: #f4f4f5; padding: 12px 16px; border-radius: 8px; min-width: 120px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    .total { font-size: 1.25rem; font-weight: 700; text-align: right; }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.title)}</h1>
  <p class="meta">${escapeHtml(data.companyName ?? 'HandymanOS AI')} · ${escapeHtml(data.customerName)} · ${escapeHtml(data.status)}</p>
  <div class="summary">
    <div><strong>${escapeHtml(labels.labor)}</strong><br>${data.laborHours}${escapeHtml(labels.laborHoursSuffix)}$${data.laborRate.toFixed(2)}${escapeHtml(labels.perHour)}</div>
    <div><strong>${escapeHtml(labels.materials)}</strong><br>$${data.materialCost.toFixed(2)}</div>
    <div><strong>${escapeHtml(labels.validUntil)}</strong><br>${escapeHtml(data.validUntil)}</div>
  </div>
  <h2>${escapeHtml(labels.lineItems)}</h2>
  <table>
    <tr><th>${escapeHtml(labels.description)}</th><th>${escapeHtml(labels.qty)}</th><th>${escapeHtml(labels.unit)}</th><th>${escapeHtml(labels.total)}</th></tr>
    ${lineRows}
  </table>
  <p class="total">${escapeHtml(labels.total)}: $${data.total.toFixed(2)}</p>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export interface InvoicePdfLabels extends PdfTableLabels {
  invoiceTitle: string
  subtotal: string
  tax: string
  dueDate: string
  paid: string
  balance: string
}

export interface InvoicePdfData {
  invoiceNumber: string
  customerName: string
  status: string
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  dueDate: string
  lineItems: Invoice['line_items']
  companyName?: string
  labels: InvoicePdfLabels
}

export function exportInvoicePdf(data: InvoicePdfData) {
  const { labels } = data
  const lineRows = data.lineItems.length
    ? data.lineItems.map((item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>$${item.unit_price.toFixed(2)}</td><td>$${item.total.toFixed(2)}</td></tr>`,
      ).join('\n')
    : `<tr><td colspan="4">${escapeHtml(labels.noLineItems)}</td></tr>`

  const balance = data.total - data.amountPaid

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.invoiceNumber)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary div { background: #f4f4f5; padding: 12px 16px; border-radius: 8px; min-width: 120px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    .total { font-size: 1.25rem; font-weight: 700; text-align: right; }
  </style>
</head>
<body>
  <h1>${escapeHtml(labels.invoiceTitle)} ${escapeHtml(data.invoiceNumber)}</h1>
  <p class="meta">${escapeHtml(data.companyName ?? 'HandymanOS AI')} · ${escapeHtml(data.customerName)} · ${escapeHtml(data.status)}</p>
  <div class="summary">
    <div><strong>${escapeHtml(labels.subtotal)}</strong><br>$${data.subtotal.toFixed(2)}</div>
    <div><strong>${escapeHtml(labels.tax)}</strong><br>$${data.tax.toFixed(2)}</div>
    <div><strong>${escapeHtml(labels.dueDate)}</strong><br>${escapeHtml(data.dueDate)}</div>
    <div><strong>${escapeHtml(labels.paid)}</strong><br>$${data.amountPaid.toFixed(2)}</div>
    <div><strong>${escapeHtml(labels.balance)}</strong><br>$${balance.toFixed(2)}</div>
  </div>
  <h2>${escapeHtml(labels.lineItems)}</h2>
  <table>
    <tr><th>${escapeHtml(labels.description)}</th><th>${escapeHtml(labels.qty)}</th><th>${escapeHtml(labels.unit)}</th><th>${escapeHtml(labels.total)}</th></tr>
    ${lineRows}
  </table>
  <p class="total">${escapeHtml(labels.total)}: $${data.total.toFixed(2)}</p>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export function isNTEExceeded(nte: number, estimate: number): boolean {
  return nte > 0 && estimate > nte
}
