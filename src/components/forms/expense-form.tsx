import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseSchema, type ExpenseFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/contexts/locale-context'
import { EXPENSE_CATEGORY_KEYS } from '@/lib/analytics'
import type { Expense } from '@/types'

interface ExpenseFormProps {
  companyId: string
  initial?: Expense
  onSubmit: (expense: Expense) => void
  onCancel?: () => void
}

export function ExpenseForm({ companyId, initial, onSubmit, onCancel }: ExpenseFormProps) {
  const { t } = useTranslation()
  const categoryLabels: Record<(typeof EXPENSE_CATEGORY_KEYS)[number], string> = {
    Fuel: t.expenses.categories.fuel,
    Materials: t.expenses.categories.materials,
    Tools: t.expenses.categories.tools,
    Insurance: t.expenses.categories.insurance,
    Office: t.expenses.categories.office,
    Other: t.expenses.categories.other,
  }
  const categoryOptions = EXPENSE_CATEGORY_KEYS.map((key) => ({
    value: key,
    label: categoryLabels[key],
  }))
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initial
      ? {
          date: initial.date.slice(0, 10),
          category: initial.category,
          description: initial.description,
          amount: initial.amount,
        }
      : { date: new Date().toISOString().slice(0, 10), category: 'Materials' },
  })

  const submit = (values: ExpenseFormValues) => {
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      company_id: companyId,
      category: values.category,
      description: values.description,
      amount: values.amount,
      date: values.date,
      job_id: initial?.job_id,
      vehicle_id: initial?.vehicle_id,
      created_at: initial?.created_at ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="expense-form">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.expenses.category}</Label>
          <Input className="mt-1" list="expense-categories" {...register('category')} />
          <datalist id="expense-categories">
            {categoryOptions.map((c) => <option key={c.value} value={c.value} label={c.label} />)}
          </datalist>
          {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <Label>{t.vehicles.date}</Label>
          <Input className="mt-1" type="date" {...register('date')} />
        </div>
      </div>
      <div>
        <Label>{t.expenses.descriptionCol}</Label>
        <Input className="mt-1" {...register('description')} />
        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <Label>{t.expenses.amount}</Label>
        <Input className="mt-1" type="number" step="0.01" {...register('amount')} />
        {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="expense-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
