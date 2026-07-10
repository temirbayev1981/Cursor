import { useState } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExpenseForm } from '@/components/forms/expense-form'
import { useAuth } from '@/contexts/auth-context'
import { useExpenses, useSaveExpense } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Expense } from '@/types'

export default function ExpensesPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const { data: expenses = [], isLoading } = useExpenses()
  const saveExpense = useSaveExpense()
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const handleSave = (expense: Expense) => {
    saveExpense.mutate(expense, {
      onSuccess: () => {
        toast.success(t.common.save)
        setShowForm(false)
        setEditingExpense(null)
      },
    })
  }

  if (isLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader
        title={t.expenses.title}
        description={t.expenses.description}
        actions={<Button onClick={() => { setEditingExpense(null); setShowForm(true) }}><Plus className="h-4 w-4" />{t.expenses.addExpense}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingExpense ? t.common.edit : t.expenses.addExpense}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingExpense(null) }}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              companyId={companyId}
              initial={editingExpense ?? undefined}
              onSubmit={handleSave}
              onCancel={() => { setShowForm(false); setEditingExpense(null) }}
            />
          </CardContent>
        </Card>
      )}

      <div className="glass-card p-5 mb-6 inline-block" data-testid="expenses-monthly-total">
        <p className="text-sm text-muted-foreground">{t.expenses.totalMonth}</p>
        <p className="text-3xl font-bold">{formatCurrency(total)}</p>
      </div>

      <DataTable headers={[t.vehicles.date, t.expenses.category, t.expenses.descriptionCol, t.expenses.amount, t.expenses.linked, '']}>
        {expenses.map((exp) => (
          <DataTableRow key={exp.id}>
            <DataTableCell>{formatDate(exp.date, dateLocale)}</DataTableCell>
            <DataTableCell><Badge variant="outline">{exp.category}</Badge></DataTableCell>
            <DataTableCell>{exp.description}</DataTableCell>
            <DataTableCell className="font-medium">{formatCurrency(exp.amount)}</DataTableCell>
            <DataTableCell className="text-muted-foreground">
              {exp.job_id ? t.expenses.job : exp.vehicle_id ? t.expenses.vehicle : '—'}
            </DataTableCell>
            <DataTableCell>
              <Button
                variant="ghost"
                size="icon"
                title={t.common.edit}
                data-testid={`expense-edit-${exp.id}`}
                onClick={() => { setEditingExpense(exp); setShowForm(true) }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  )
}
