import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_EXPENSES } from '@/data/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

export default function ExpensesPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
  const total = DEMO_EXPENSES.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <PageHeader
        title={t.expenses.title}
        description={t.expenses.description}
        actions={<Button><Plus className="h-4 w-4" />{t.expenses.addExpense}</Button>}
      />

      <div className="glass-card p-5 mb-6 inline-block">
        <p className="text-sm text-muted-foreground">{t.expenses.totalMonth}</p>
        <p className="text-3xl font-bold">{formatCurrency(total)}</p>
      </div>

      <DataTable headers={[t.vehicles.date, t.expenses.category, t.expenses.descriptionCol, t.expenses.amount, t.expenses.linked]}>
        {DEMO_EXPENSES.map((exp) => (
          <DataTableRow key={exp.id}>
            <DataTableCell>{formatDate(exp.date, dateLocale)}</DataTableCell>
            <DataTableCell><Badge variant="outline">{exp.category}</Badge></DataTableCell>
            <DataTableCell>{exp.description}</DataTableCell>
            <DataTableCell className="font-medium">{formatCurrency(exp.amount)}</DataTableCell>
            <DataTableCell className="text-muted-foreground">
              {exp.job_id ? t.expenses.job : exp.vehicle_id ? t.expenses.vehicle : '—'}
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  )
}
