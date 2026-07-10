import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { estimateSchema, type EstimateFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { Customer, Estimate } from '@/types'

interface EstimateFormProps {
  companyId: string
  customers: Customer[]
  defaultLaborRate?: number
  onSubmit: (estimate: Estimate) => void
  onCancel?: () => void
}

export function EstimateForm({ companyId, customers, defaultLaborRate = 75, onSubmit, onCancel }: EstimateFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      labor_rate: defaultLaborRate,
      labor_hours: 2,
      material_cost: 0,
      markup_percent: 25,
      valid_days: 14,
    },
  })

  const customerId = watch('customer_id')
  const laborHours = Number(watch('labor_hours')) || 0
  const laborRate = Number(watch('labor_rate')) || 0
  const materialCost = Number(watch('material_cost')) || 0
  const markup = Number(watch('markup_percent')) || 0
  const laborTotal = laborHours * laborRate
  const total = laborTotal + materialCost * (1 + markup / 100)

  const submit = (values: EstimateFormValues) => {
    const labor = values.labor_hours * values.labor_rate
    const grandTotal = labor + values.material_cost * (1 + values.markup_percent / 100)
    onSubmit({
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_id: values.customer_id,
      title: values.title,
      status: 'draft',
      labor_hours: values.labor_hours,
      labor_rate: values.labor_rate,
      material_cost: values.material_cost,
      markup_percent: values.markup_percent,
      total: Math.round(grandTotal * 100) / 100,
      valid_until: new Date(Date.now() + values.valid_days * 86400000).toISOString(),
      line_items: [
        {
          id: crypto.randomUUID(),
          description: `${values.title} — труд`,
          quantity: values.labor_hours,
          unit_price: values.labor_rate,
          total: labor,
          type: 'labor',
        },
        ...(values.material_cost > 0 ? [{
          id: crypto.randomUUID(),
          description: 'Материалы',
          quantity: 1,
          unit_price: values.material_cost * (1 + values.markup_percent / 100),
          total: values.material_cost * (1 + values.markup_percent / 100),
          type: 'material' as const,
        }] : []),
      ],
      created_at: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="estimate-form">
      <div>
        <Label>{t.estimates.estimate}</Label>
        <Input className="mt-1" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>{t.invoices.customer}</Label>
        <Select value={customerId} onValueChange={(v) => setValue('customer_id', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customer_id && <p className="text-xs text-destructive mt-1">{errors.customer_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label>{t.estimates.labor} ({t.common.hours})</Label>
          <Input className="mt-1" type="number" step="0.5" {...register('labor_hours')} />
        </div>
        <div>
          <Label>$/ {t.common.hr}</Label>
          <Input className="mt-1" type="number" {...register('labor_rate')} />
        </div>
        <div>
          <Label>{t.estimates.materials}</Label>
          <Input className="mt-1" type="number" {...register('material_cost')} />
        </div>
        <div>
          <Label>{t.materials.markup} %</Label>
          <Input className="mt-1" type="number" {...register('markup_percent')} />
        </div>
      </div>
      <div>
        <Label>{t.estimates.validUntil} (дней)</Label>
        <Input className="mt-1" type="number" {...register('valid_days')} />
      </div>
      <p className="text-lg font-semibold">{t.estimates.total}: ${total.toFixed(2)}</p>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="estimate-form-submit">{t.estimates.newEstimate}</Button>
      </div>
    </form>
  )
}
