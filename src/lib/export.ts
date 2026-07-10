import * as XLSX from 'xlsx'
import type { VendorPORecord } from '@/types/vendor-po'

export function exportVendorPOsToExcel(records: VendorPORecord[], filename = 'vendor-po-export.xlsx') {
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

export function groupVendorPOsByAddress(records: VendorPORecord[]): Map<string, VendorPORecord[]> {
  const groups = new Map<string, VendorPORecord[]>()
  for (const r of records) {
    const key = `${r.service_address}, ${r.service_city}, ${r.service_state}`
    const list = groups.get(key) ?? []
    list.push(r)
    groups.set(key, list)
  }
  return groups
}

export function exportJobsToCsv(jobs: import('@/types').Job[], filename = 'jobs-report.csv') {
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

export function exportFinancialReport(
  jobs: import('@/types').Job[],
  customers: import('@/types').Customer[],
  filename = 'financial-report.xlsx'
) {
  const jobRows = jobs.map((j) => {
    const customer = customers.find((c) => c.id === j.customer_id)
    return {
      Job: j.title,
      Customer: customer?.name ?? '',
      Revenue: j.revenue,
      Profit: j.profit,
      Status: j.status,
    }
  })
  const ws = XLSX.utils.json_to_sheet(jobRows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Financial')
  XLSX.writeFile(wb, filename)
}

export function exportReportPdfPlaceholder(title: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<html><head><title>${title}</title></head><body><h1>${title}</h1><p>HandymanOS AI — PDF export (подключите backend для полного PDF)</p></body></html>`)
  win.print()
}

export function isNTEExceeded(nte: number, estimate: number): boolean {
  return nte > 0 && estimate > nte
}
