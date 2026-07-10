import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { InvoiceStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { useInvoices, useCustomers } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

export default function InvoicesPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices()
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amount_paid), 0)

  if (invoicesLoading || customersLoading) return <TableSkeleton cols={8} />

  return (
    <div>
      <PageHeader
        title={t.invoices.title}
        description={t.invoices.description}
        actions={<Button><Plus className="h-4 w-4" />{t.invoices.createInvoice}</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{t.invoices.outstanding}</p>
          <p className="text-2xl font-bold text-warning">{formatCurrency(outstanding)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{t.invoices.paidMonth}</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(3031)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{t.invoices.totalInvoices}</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </div>
      </div>

      <DataTable headers={[t.invoices.invoiceNum, t.invoices.customer, t.invoices.status, t.invoices.subtotal, t.invoices.tax, t.invoices.total, t.invoices.paid, t.invoices.dueDate]}>
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
            </DataTableRow>
          )
        })}
      </DataTable>
    </div>
  )
}
