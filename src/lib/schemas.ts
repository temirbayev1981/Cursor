import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(2, 'Имя обязательно'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(7, 'Укажите телефон'),
  address: z.string().min(5, 'Укажите адрес'),
  type: z.enum(['residential', 'commercial', 'property_management']),
  notes: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export const jobSchema = z.object({
  title: z.string().min(3, 'Укажите название'),
  customer_id: z.string().min(1, 'Выберите клиента'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'emergency']),
  estimated_hours: z.coerce.number().min(0.5).max(200),
  revenue: z.coerce.number().min(0),
})

export type JobFormValues = z.infer<typeof jobSchema>

export const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Выберите клиента'),
  subtotal: z.coerce.number().min(0),
  tax: z.coerce.number().min(0),
  due_days: z.coerce.number().min(1).max(90),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

export const onboardingCompanySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
})
