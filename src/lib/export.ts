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

export function isNTEExceeded(nte: number, estimate: number): boolean {
  return nte > 0 && estimate > nte
}
