import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { employeeSchema, type EmployeeFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/contexts/locale-context'
import type { Employee } from '@/types'

interface EmployeeFormProps {
  companyId: string
  onSubmit: (employee: Employee) => void
  onCancel?: () => void
}

export function EmployeeForm({ companyId, onSubmit, onCancel }: EmployeeFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { hourly_wage: 25, billing_rate: 75 },
  })

  const submit = (values: EmployeeFormValues) => {
    onSubmit({
      id: crypto.randomUUID(),
      company_id: companyId,
      name: values.name,
      role: values.role,
      phone: values.phone,
      hourly_wage: values.hourly_wage,
      billing_rate: values.billing_rate,
      payroll_tax_rate: 0.12,
      insurance_cost_monthly: 400,
      benefits_monthly: 300,
      overhead_allocation: 6,
      is_active: true,
      skills: values.skills ? values.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      created_at: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.onboarding.name}</Label>
          <Input className="mt-1" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label>{t.onboarding.role}</Label>
          <Input className="mt-1" {...register('role')} placeholder="Technician" />
          {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
        </div>
      </div>
      <div>
        <Label>{t.onboarding.phone}</Label>
        <Input className="mt-1" {...register('phone')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.technicians.wage}</Label>
          <Input className="mt-1" type="number" step="0.01" {...register('hourly_wage')} />
        </div>
        <div>
          <Label>{t.technicians.billingRate}</Label>
          <Input className="mt-1" type="number" step="0.01" {...register('billing_rate')} />
        </div>
      </div>
      <div>
        <Label>Skills (comma-separated)</Label>
        <Input className="mt-1" {...register('skills')} placeholder="Plumbing, Drywall" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting}>{t.common.save}</Button>
      </div>
    </form>
  )
}
