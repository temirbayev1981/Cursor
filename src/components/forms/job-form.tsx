import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { jobSchema, type JobFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/contexts/locale-context'
import type { CustomerContact } from '@/services/entity-service'
import type { Job } from '@/types'

interface JobFormProps {
  companyId: string
  customers: CustomerContact[]
  onSubmit: (job: Job) => void
  onCancel?: () => void
}

export function JobForm({ companyId, customers, onSubmit, onCancel }: JobFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { priority: 'medium', estimated_hours: 2, revenue: 0 },
  })

  const customerId = watch('customer_id')
  const priority = watch('priority')

  const submit = (values: JobFormValues) => {
    onSubmit({
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_id: values.customer_id,
      title: values.title,
      description: values.description ?? '',
      status: 'draft',
      priority: values.priority,
      estimated_hours: values.estimated_hours,
      actual_hours: 0,
      revenue: values.revenue,
      labor_cost: 0,
      material_cost: 0,
      fuel_cost: 0,
      overhead_cost: 0,
      profit: 0,
      profit_margin: 0,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" data-testid="job-form">
      <div>
        <Label>{t.jobs.job}</Label>
        <Input className="mt-1" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>{t.jobs.customer}</Label>
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
        <Label>{t.common.notes}</Label>
        <Textarea className="mt-1" {...register('description')} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t.jobs.priority}</Label>
          <Select value={priority} onValueChange={(v) => setValue('priority', v as JobFormValues['priority'])}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t.jobs.estimated} ({t.common.hours})</Label>
          <Input className="mt-1" type="number" step="0.5" {...register('estimated_hours')} />
        </div>
        <div>
          <Label>{t.jobs.revenue}</Label>
          <Input className="mt-1" type="number" {...register('revenue')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting} data-testid="job-form-submit">{t.common.save}</Button>
      </div>
    </form>
  )
}
