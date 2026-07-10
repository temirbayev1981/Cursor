import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema, type CustomerFormValues } from '@/lib/schemas'
import { resolveCustomerNotificationPreferences } from '@/lib/customer-notification-prefs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { Customer } from '@/types'

interface CustomerFormProps {
  companyId: string
  initial?: Customer
  onSubmit: (customer: Customer) => void
  onCancel?: () => void
}

export function CustomerForm({ companyId, initial, onSubmit, onCancel }: CustomerFormProps) {
  const { t } = useTranslation()
  const initialPrefs = initial
    ? resolveCustomerNotificationPreferences(initial.id, initial)
    : { email: true, sms: false }
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          email: initial.email,
          phone: initial.phone,
          address: initial.address,
          type: initial.type,
          notes: initial.notes,
          notify_email: initialPrefs.email,
          notify_sms: initialPrefs.sms,
        }
      : { type: 'residential', notify_email: true, notify_sms: false },
  })

  const type = watch('type')
  const notifyEmail = watch('notify_email')
  const notifySms = watch('notify_sms')

  const submit = (values: CustomerFormValues) => {
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      company_id: companyId,
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      type: values.type,
      notes: values.notes,
      notification_preferences: { email: values.notify_email, sms: values.notify_sms },
      total_revenue: initial?.total_revenue ?? 0,
      job_count: initial?.job_count ?? 0,
      created_at: initial?.created_at ?? new Date().toISOString(),
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
      <div className="space-y-3 rounded-lg border p-4" data-testid="customer-form-notification-prefs">
        <p className="text-sm font-medium">{t.customers.notificationPreferences}</p>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="customer-notify-email">{t.customers.notifyEmail}</Label>
          <Switch
            id="customer-notify-email"
            checked={notifyEmail}
            data-testid="customer-form-notify-email"
            onCheckedChange={(checked) => setValue('notify_email', checked)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="customer-notify-sms">{t.customers.notifySms}</Label>
          <Switch
            id="customer-notify-sms"
            checked={notifySms}
            data-testid="customer-form-notify-sms"
            onCheckedChange={(checked) => setValue('notify_sms', checked)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="customer-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
