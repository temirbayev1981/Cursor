import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Mail, X, Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { InvoiceStatusBadge } from '@/components/shared/status-badge'
import { InvoiceForm } from '@/components/forms/invoice-form'
import { StripePayButton } from '@/components/payments/stripe-pay-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useInvoices, useCustomers, useSaveInvoice, useSendInvoice, usePayInvoice } from '@/hooks/use-entities'
import { generateInvoiceNumber } from '@/services/payment-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportInvoicePdf } from '@/lib/export'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Invoice } from '@/types'

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export default function InvoicesPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const { data: invoices = [], isLoading: invoicesLoading, refetch } = useInvoices()
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const saveInvoice = useSaveInvoice()
  const sendInvoice = useSendInvoice()
  const payInvoice = usePayInvoice()
  const processedPaidRef = useRef<string | null>(null)

  useEffect(() => {
    const paidId = searchParams.get('paid')
    if (!paidId || invoices.length === 0 || processedPaidRef.current === paidId) return
    const invoice = invoices.find((i) => i.id === paidId)
    if (!invoice || invoice.status === 'paid') {
      setSearchParams({}, { replace: true })
      return
    }
    processedPaidRef.current = paidId
    payInvoice.mutate(
      { invoice, amount: invoice.total - invoice.amount_paid },
      {
        onSuccess: () => {
          toast.success(t.invoices.paymentReceived)
          setSearchParams({}, { replace: true })
          refetch()
        },
      }
    )
  }, [searchParams, invoices, payInvoice, setSearchParams, refetch, t.invoices.paymentReceived])

  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const paidMonth = invoices
    .filter((i) => i.status === 'paid' && i.paid_date && isThisMonth(i.paid_date))
    .reduce((s, i) => s + i.amount_paid, 0)

  if (invoicesLoading || customersLoading) return <TableSkeleton cols={8} />

  const handleCreate = (invoice: Invoice) => {
    saveInvoice.mutate(invoice, {
      onSuccess: () => {
        toast.success(t.invoices.createInvoice)
        setShowForm(false)
      },
    })
  }

  const handleSend = (invoice: Invoice) => {
    const customer = customers.find((c) => c.id === invoice.customer_id)
    if (!customer?.email) return
    sendInvoice.mutate({ invoice, email: customer.email, customer }, {
      onSuccess: ({ notification }) => {
        if (notification.skipped) {
          toast.info(t.invoices.invoiceSentSkipped.replace('{email}', customer.email))
        } else {
          toast.success(t.invoices.invoiceSent.replace('{email}', customer.email))
        }
      },
    })
  }

  const handleExportPdf = (invoice: Invoice, customerName: string) => {
    exportInvoicePdf({
      invoiceNumber: invoice.invoice_number,
      customerName,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      dueDate: invoice.due_date,
      lineItems: invoice.line_items,
      companyName: company?.name,
      labels: {
        invoiceTitle: t.invoices.pdf.invoiceTitle,
        subtotal: t.invoices.subtotal,
        tax: t.invoices.tax,
        dueDate: t.invoices.dueDate,
        paid: t.invoices.paid,
        balance: t.invoices.pdf.balance,
        lineItems: t.invoices.pdf.lineItems,
        description: t.invoices.pdf.description,
        qty: t.invoices.pdf.qty,
        unit: t.invoices.pdf.unit,
        total: t.invoices.total,
        noLineItems: t.invoices.pdf.noLineItems,
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={t.invoices.title}
        description={t.invoices.description}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />{t.invoices.createInvoice}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.invoices.createInvoice}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              companyId={companyId}
              customers={customers}
              invoiceNumber={generateInvoiceNumber(invoices)}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" data-testid="invoices-summary-stats">
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{t.invoices.outstanding}</p>
          <p className="text-2xl font-bold text-warning" data-testid="invoices-outstanding-total">{formatCurrency(outstanding)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{t.invoices.paidMonth}</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(paidMonth)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{t.invoices.totalInvoices}</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </div>
      </div>

      <DataTable headers={[t.invoices.invoiceNum, t.invoices.customer, t.invoices.status, t.invoices.subtotal, t.invoices.tax, t.invoices.total, t.invoices.paid, t.invoices.dueDate, '']}>
        {invoices.map((inv) => {
          const customer = customers.find((c) => c.id === inv.customer_id)
          return (
            <DataTableRow key={inv.id}>
              <DataTableCell className="font-medium">{inv.invoice_number}</DataTableCell>
              <DataTableCell>{customer?.name}</DataTableCell>
              <DataTableCell><InvoiceStatusBadge status={inv.status} /></DataTableCell>
              <DataTableCell>{formatCurrency(inv.subtotal)}</DataTableCell>
              <DataTableCell>{formatCurrency(inv.tax)}</DataTableCell>
              <DataTableCell className="font-semibold">{formatCurrency(inv.total)}</DataTableCell>
              <DataTableCell>{formatCurrency(inv.amount_paid)}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(inv.due_date, dateLocale)}</DataTableCell>
              <DataTableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title={t.common.exportPdf}
                    onClick={() => handleExportPdf(inv, customer?.name ?? '')}
                    data-testid={`invoice-export-pdf-${inv.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {inv.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => handleSend(inv)} data-testid={`invoice-send-${inv.id}`}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  <StripePayButton invoice={inv} customerEmail={customer?.email} onSuccess={() => refetch()} />
                </div>
              </DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>
    </div>
  )
}
