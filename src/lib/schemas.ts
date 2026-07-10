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

export const estimateSchema = z.object({
  title: z.string().min(3, 'Укажите название'),
  customer_id: z.string().min(1, 'Выберите клиента'),
  labor_hours: z.coerce.number().min(0.5).max(500),
  labor_rate: z.coerce.number().min(0),
  material_cost: z.coerce.number().min(0),
  markup_percent: z.coerce.number().min(0).max(200),
  valid_days: z.coerce.number().min(1).max(90),
})

export type EstimateFormValues = z.infer<typeof estimateSchema>

export const propertySchema = z.object({
  name: z.string().min(2, 'Укажите название'),
  customer_id: z.string().min(1, 'Выберите клиента'),
  address: z.string().min(5, 'Укажите адрес'),
  property_type: z.enum(['apartment', 'townhouse', 'single_family', 'commercial', 'multi_family']),
  unit_number: z.string().optional(),
  access_notes: z.string().optional(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>

export const scheduleSchema = z.object({
  job_id: z.string().min(1, 'Выберите заказ'),
  technician_id: z.string().min(1, 'Выберите мастера'),
  date: z.string().min(1, 'Укажите дату'),
  start_hour: z.coerce.number().min(6).max(20),
  duration_hours: z.coerce.number().min(0.5).max(12),
})

export type ScheduleFormValues = z.infer<typeof scheduleSchema>

export const portalRequestSchema = z.object({
  title: z.string().min(3, 'Укажите название'),
  description: z.string().min(5, 'Опишите проблему'),
  priority: z.enum(['low', 'medium', 'high', 'emergency']),
})

export type PortalRequestFormValues = z.infer<typeof portalRequestSchema>

export const onboardingCompanySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
})

export const employeeSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  phone: z.string().optional(),
  hourly_wage: z.coerce.number().min(0),
  billing_rate: z.coerce.number().min(0),
  skills: z.string().optional(),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

export const materialSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  supplier: z.string().min(1),
  cost: z.coerce.number().min(0),
  markup_percent: z.coerce.number().min(0).max(200),
  quantity: z.coerce.number().min(0),
  reorder_level: z.coerce.number().min(0),
  unit: z.string().min(1),
})

export type MaterialFormValues = z.infer<typeof materialSchema>

export const vehicleSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['truck', 'van', 'trailer', 'car']),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().min(1990).max(2030),
  license_plate: z.string().min(2),
  mileage: z.coerce.number().min(0),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>

export const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(2),
  amount: z.coerce.number().min(0.01),
  date: z.string().min(1),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
