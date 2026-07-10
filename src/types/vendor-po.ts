export interface VendorPORecord {
  id: string
  company_id: string
  vendor_po_number: string
  client_po_number: string
  priority: string
  order_type: string
  nte_amount: number
  service_date?: string
  print_date?: string
  client_company: string
  client_contact: string
  client_phone: string
  client_email: string
  client_address: string
  service_location_name: string
  location_number?: string
  service_address: string
  service_city: string
  service_state: string
  service_zip: string
  service_phone: string
  vendor_name: string
  vendor_number?: string
  vendor_address: string
  vendor_phone: string
  service_category: string
  service_description: string
  work_summary: string
  special_instructions?: string
  source_file_name: string
  status: 'parsed' | 'review' | 'approved' | 'scheduled'
  created_at: string
}

export type VendorPOInput = Omit<VendorPORecord, 'id' | 'created_at' | 'status'> & {
  status?: VendorPORecord['status']
}
