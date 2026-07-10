import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema, type CustomerFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { Customer } from '@/types'

interface CustomerFormProps {
  companyId: string
  onSubmit: (customer: Customer) => void
  onCancel?: () => void
}

export function CustomerForm({ companyId, onSubmit, onCancel }: CustomerFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { type: 'residential' },
  })

  const type = watch('type')

  const submit = (values: CustomerFormValues) => {
    onSubmit({
      id: crypto.randomUUID(),
      company_id: companyId,
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      type: values.type,
      notes: values.notes,
      total_revenue: 0,
      job_count: 0,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="customer-form">
      <div>
        <Label>{t.customers.customer}</Label>
        <Input className="mt-1" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.auth.email}</Label>
          <Input className="mt-1" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>{t.onboarding.phone}</Label>
          <Input className="mt-1" {...register('phone')} />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <Label>{t.onboarding.address}</Label>
        <Input className="mt-1" {...register('address')} />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
      </div>
      <div>
        <Label>{t.customers.type}</Label>
        <Select value={type} onValueChange={(v) => setValue('type', v as CustomerFormValues['type'])}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="residential">{t.customers.residential}</SelectItem>
            <SelectItem value="commercial">{t.customers.commercial}</SelectItem>
            <SelectItem value="property_management">{t.customers.property_management}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="customer-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
