import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_EXPENSES } from '@/data/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ExpensesPage() {
  const total = DEMO_EXPENSES.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track business expenses and job costs"
        actions={<Button><Plus className="h-4 w-4" />Add Expense</Button>}
      />

      <div className="glass-card p-5 mb-6 inline-block">
        <p className="text-sm text-muted-foreground">Total This Month</p>
        <p className="text-3xl font-bold">{formatCurrency(total)}</p>
      </div>

      <DataTable headers={['Date', 'Category', 'Description', 'Amount', 'Linked']}>
        {DEMO_EXPENSES.map((exp) => (
          <DataTableRow key={exp.id}>
            <DataTableCell>{formatDate(exp.date)}</DataTableCell>
            <DataTableCell><Badge variant="outline">{exp.category}</Badge></DataTableCell>
            <DataTableCell>{exp.description}</DataTableCell>
            <DataTableCell className="font-medium">{formatCurrency(exp.amount)}</DataTableCell>
            <DataTableCell className="text-muted-foreground">
              {exp.job_id ? 'Job' : exp.vehicle_id ? 'Vehicle' : '—'}
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  )
}
