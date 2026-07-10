import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { materialSchema, type MaterialFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/contexts/locale-context'
import type { Material } from '@/types'

interface MaterialFormProps {
  companyId: string
  onSubmit: (material: Material) => void
  onCancel?: () => void
}

export function MaterialForm({ companyId, onSubmit, onCancel }: MaterialFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { markup_percent: 35, quantity: 0, reorder_level: 5, unit: 'each' },
  })

  const submit = (values: MaterialFormValues) => {
    const customer_price = Math.round(values.cost * (1 + values.markup_percent / 100) * 100) / 100
    onSubmit({
      id: crypto.randomUUID(),
      company_id: companyId,
      name: values.name,
      category: values.category,
      supplier: values.supplier,
      cost: values.cost,
      markup_percent: values.markup_percent,
      customer_price,
      quantity: values.quantity,
      reorder_level: values.reorder_level,
      unit: values.unit,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="material-form">
      <div>
        <Label>{t.materials.material}</Label>
        <Input className="mt-1" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.materials.category}</Label>
          <Input className="mt-1" {...register('category')} />
        </div>
        <div>
          <Label>{t.materials.supplier}</Label>
          <Input className="mt-1" {...register('supplier')} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t.materials.cost}</Label>
          <Input className="mt-1" type="number" step="0.01" {...register('cost')} />
        </div>
        <div>
          <Label>{t.materials.markup}</Label>
          <Input className="mt-1" type="number" step="1" {...register('markup_percent')} />
        </div>
        <div>
          <Label>{t.materials.qty}</Label>
          <Input className="mt-1" type="number" step="1" {...register('quantity')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Reorder level</Label>
          <Input className="mt-1" type="number" step="1" {...register('reorder_level')} />
        </div>
        <div>
          <Label>Unit</Label>
          <Input className="mt-1" {...register('unit')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="material-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
