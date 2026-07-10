import type { Invoice, Payment } from '@/types'
import { loadStore, STORE_KEYS } from '@/lib/data-store'
import { saveEntity, savePayment } from '@/services/entity-service'
import { notifyInvoiceSent } from '@/services/notification-service'

export async function recordInvoicePayment(
  invoice: Invoice,
  amount: number,
  method: Payment['method'] = 'stripe',
  stripePaymentId?: string
): Promise<Invoice> {
  const payment: Payment = {
    id: crypto.randomUUID(),
    invoice_id: invoice.id,
    amount,
    method,
    stripe_payment_id: stripePaymentId,
    created_at: new Date().toISOString(),
  }

  await savePayment(payment)

  const newPaid = invoice.amount_paid + amount
  const updated: Invoice = {
    ...invoice,
    amount_paid: newPaid,
    status: newPaid >= invoice.total ? 'paid' : 'partial',
    paid_date: newPaid >= invoice.total ? new Date().toISOString() : invoice.paid_date,
  }

  return saveEntity('invoices', updated)
}

export function getPaymentsForInvoice(invoiceId: string): Payment[] {
  return loadStore<Payment>(STORE_KEYS.payments).filter((p) => p.invoice_id === invoiceId)
}

export function getAllPayments(): Payment[] {
  return loadStore<Payment>(STORE_KEYS.payments)
}

export async function sendInvoiceToCustomer(invoice: Invoice, customerEmail: string): Promise<Invoice> {
  await notifyInvoiceSent(customerEmail, invoice.invoice_number, invoice.total)
  if (invoice.status === 'draft') {
    return saveEntity('invoices', { ...invoice, status: 'sent' })
  }
  return invoice
}

export function generateInvoiceNumber(existing: Invoice[]): string {
  const max = existing.reduce((m, inv) => {
    const num = parseInt(inv.invoice_number.replace(/\D/g, ''), 10)
    return Number.isFinite(num) ? Math.max(m, num) : m
  }, 1000)
  return `INV-${max + 1}`
}
