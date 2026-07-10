import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { InvoiceStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { DEMO_INVOICES, DEMO_CUSTOMERS } from '@/data/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoicesPage() {
  const outstanding = DEMO_INVOICES.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amount_paid), 0)

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Billing, payments, and Stripe integration"
        actions={<Button><Plus className="h-4 w-4" />Create Invoice</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-warning">{formatCurrency(outstanding)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Paid This Month</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(3031)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{DEMO_INVOICES.length}</p>
        </div>
      </div>

      <DataTable headers={['Invoice #', 'Customer', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid', 'Due Date']}>
        {DEMO_INVOICES.map((inv) => {
          const customer = DEMO_CUSTOMERS.find((c) => c.id === inv.customer_id)
          return (
            <DataTableRow key={inv.id}>
              <DataTableCell className="font-medium">{inv.invoice_number}</DataTableCell>
              <DataTableCell>{customer?.name}</DataTableCell>
              <DataTableCell><InvoiceStatusBadge status={inv.status} /></DataTableCell>
              <DataTableCell>{formatCurrency(inv.subtotal)}</DataTableCell>
              <DataTableCell>{formatCurrency(inv.tax)}</DataTableCell>
              <DataTableCell className="font-semibold">{formatCurrency(inv.total)}</DataTableCell>
              <DataTableCell>{formatCurrency(inv.amount_paid)}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(inv.due_date)}</DataTableCell>
            </DataTableRow>
          )
        })}
      </DataTable>
    </div>
  )
}
