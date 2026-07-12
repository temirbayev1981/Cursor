import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoiceSchema, type InvoiceFormValues } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/contexts/locale-context'
import type { CustomerContact } from '@/services/entity-service'
import type { Invoice } from '@/types'

interface InvoiceFormProps {
  companyId: string
  customers: CustomerContact[]
  invoiceNumber: string
  onSubmit: (invoice: Invoice) => void
  onCancel?: () => void
}

export function InvoiceForm({ companyId, customers, invoiceNumber, onSubmit, onCancel }: InvoiceFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { due_days: 14, tax: 0, subtotal: 0 },
  })

  const customerId = watch('customer_id')
  const subtotal = watch('subtotal')
  const tax = watch('tax')

  const submit = (values: InvoiceFormValues) => {
    const total = values.subtotal + values.tax
    onSubmit({
      id: crypto.randomUUID(),
      company_id: companyId,
      customer_id: values.customer_id,
      invoice_number: invoiceNumber,
      status: 'draft',
      subtotal: values.subtotal,
      tax: values.tax,
      total,
      amount_paid: 0,
      due_date: new Date(Date.now() + values.due_days * 86400000).toISOString(),
      line_items: [{
        id: crypto.randomUUID(),
        description: `Invoice ${invoiceNumber}`,
        quantity: 1,
        unit_price: values.subtotal,
        total: values.subtotal,
        type: 'service',
      }],
      created_at: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <Label>{t.invoices.invoiceNum}</Label>
        <Input className="mt-1" value={invoiceNumber} readOnly />
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.invoices.subtotal}</Label>
          <Input className="mt-1" type="number" step="0.01" {...register('subtotal')} />
        </div>
        <div>
          <Label>{t.invoices.tax}</Label>
          <Input className="mt-1" type="number" step="0.01" {...register('tax')} />
        </div>
      </div>
      <div>
        <Label>{t.invoices.dueDate} (дней)</Label>
        <Input className="mt-1" type="number" {...register('due_days')} />
      </div>
      <p className="text-sm font-semibold">{t.invoices.total}: ${((Number(subtotal) || 0) + (Number(tax) || 0)).toFixed(2)}</p>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t.common.cancel}</Button>}
        <Button type="submit" disabled={isSubmitting}>{t.invoices.createInvoice}</Button>
      </div>
    </form>
  )
}
