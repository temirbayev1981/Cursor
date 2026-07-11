import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateInvoiceNumber,
  getAllPayments,
  getPaymentsForInvoice,
  recordInvoicePayment,
} from './payment-service'
import type { Invoice } from '@/types'
import { loadStore, STORE_KEYS } from '@/lib/data-store'

const baseInvoice: Invoice = {
  id: 'inv-001',
  company_id: 'comp-001',
  customer_id: 'cust-001',
  job_id: 'job-001',
  invoice_number: 'INV-1005',
  status: 'sent',
  subtotal: 100,
  tax: 0,
  total: 100,
  amount_paid: 0,
  due_date: '2026-08-01T00:00:00Z',
  line_items: [],
  created_at: '2026-07-01T00:00:00Z',
}

describe('payment-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generateInvoiceNumber increments from existing invoices', () => {
    const next = generateInvoiceNumber([
      { ...baseInvoice, invoice_number: 'INV-1008' },
      { ...baseInvoice, id: 'inv-002', invoice_number: 'INV-1010' },
    ])
    expect(next).toBe('INV-1011')
  })

  it('recordInvoicePayment marks invoice paid when amount covers total', async () => {
    const paid = await recordInvoicePayment(baseInvoice, 100, 'cash')
    expect(paid.status).toBe('paid')
    expect(paid.amount_paid).toBe(100)
    expect(getPaymentsForInvoice('inv-001')).toHaveLength(1)
    expect(getAllPayments()[0]?.method).toBe('cash')
  })

  it('recordInvoicePayment supports partial payments', async () => {
    const partial = await recordInvoicePayment(baseInvoice, 40, 'check')
    expect(partial.status).toBe('partial')
    expect(partial.amount_paid).toBe(40)
    expect(loadStore(STORE_KEYS.payments)).toHaveLength(1)
  })
})
