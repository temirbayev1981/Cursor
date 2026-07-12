import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { propertySchema, type PropertyFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { Property } from '@/types'
import type { CustomerContact } from '@/services/entity-service'

interface PropertyFormProps {
  companyId: string
  customers: CustomerContact[]
  initial?: Property
  onSubmit: (property: Property) => void
  onCancel?: () => void
}

export function PropertyForm({ companyId, customers, initial, onSubmit, onCancel }: PropertyFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: initial
      ? {
          customer_id: initial.customer_id,
          name: initial.name,
          address: initial.address,
          property_type: initial.property_type as PropertyFormValues['property_type'],
          unit_number: initial.unit_number,
          access_notes: initial.access_notes,
        }
      : { property_type: 'apartment' },
  })

  const customerId = watch('customer_id')
  const propertyType = watch('property_type')

  const submit = (values: PropertyFormValues) => {
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      company_id: companyId,
      customer_id: values.customer_id,
      name: values.name,
      address: values.address,
      property_type: values.property_type,
      unit_number: values.unit_number,
      access_notes: values.access_notes,
      created_at: initial?.created_at ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="property-form">
      <div>
        <Label>{t.properties.propertyName}</Label>
        <Input className="mt-1" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
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
      <div>
        <Label>{t.onboarding.address}</Label>
        <Input className="mt-1" {...register('address')} />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.properties.propertyType}</Label>
          <Select value={propertyType} onValueChange={(v) => setValue('property_type', v as PropertyFormValues['property_type'])}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">{t.properties.types.apartment}</SelectItem>
              <SelectItem value="townhouse">{t.properties.types.townhouse}</SelectItem>
              <SelectItem value="single_family">{t.properties.types.single_family}</SelectItem>
              <SelectItem value="commercial">{t.properties.types.commercial}</SelectItem>
              <SelectItem value="multi_family">{t.properties.types.multi_family}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t.common.unit}</Label>
          <Input className="mt-1" {...register('unit_number')} />
        </div>
      </div>
      <div>
        <Label>{t.properties.accessNotes}</Label>
        <Textarea className="mt-1" rows={2} {...register('access_notes')} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="property-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
