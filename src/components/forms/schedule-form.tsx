import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { scheduleSchema, type ScheduleFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { Employee, Job } from '@/types'

interface ScheduleFormProps {
  jobs: Job[]
  technicians: Employee[]
  onSubmit: (values: ScheduleFormValues) => void
  onCancel?: () => void
}

export function ScheduleForm({ jobs, technicians, onSubmit, onCancel }: ScheduleFormProps) {
  const { t } = useTranslation()
  const unscheduled = jobs.filter((j) => j.status === 'draft' || j.status === 'on_hold')
  const today = new Date().toISOString().slice(0, 10)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: today,
      start_hour: 9,
      duration_hours: 2,
    },
  })

  const jobId = watch('job_id')
  const technicianId = watch('technician_id')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="schedule-form">
      <div>
        <Label>{t.scheduling.selectJob}</Label>
        <Select value={jobId} onValueChange={(v) => setValue('job_id', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {unscheduled.length === 0 ? (
              <SelectItem value="_none" disabled>{t.scheduling.noUnscheduled}</SelectItem>
            ) : (
              unscheduled.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.job_id && <p className="text-xs text-destructive mt-1">{errors.job_id.message}</p>}
      </div>
      <div>
        <Label>{t.scheduling.selectTechnician}</Label>
        <Select value={technicianId} onValueChange={(v) => setValue('technician_id', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {technicians.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.technician_id && <p className="text-xs text-destructive mt-1">{errors.technician_id.message}</p>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t.scheduling.date}</Label>
          <Input className="mt-1" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <Label>{t.scheduling.startTime}</Label>
          <Input className="mt-1" type="number" min={6} max={20} {...register('start_hour')} />
        </div>
        <div>
          <Label>{t.scheduling.duration}</Label>
          <Input className="mt-1" type="number" step="0.5" min={0.5} max={12} {...register('duration_hours')} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting || unscheduled.length === 0} data-testid="schedule-form-submit">
          {t.scheduling.scheduleFromJob}
        </Button>
      </div>
    </form>
  )
}
