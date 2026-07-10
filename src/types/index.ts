export type UserRole =
  | 'owner'
  | 'admin'
  | 'dispatcher'
  | 'technician'
  | 'accountant'
  | 'customer'

export type JobStatus =
  | 'draft'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold'

export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'expired'

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'emergency'

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise'

export interface Company {
  id: string
  name: string
  email: string
  phone: string
  address: string
  logo_url?: string
  subscription_plan: SubscriptionPlan
  settings: Record<string, unknown>
  created_at: string
}

export interface Profile {
  id: string
  company_id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  created_at: string
}

export interface Customer {
  id: string
  company_id: string
  name: string
  email: string
  phone: string
  address: string
  type: 'residential' | 'commercial' | 'property_management'
  notes?: string
  total_revenue: number
  job_count: number
  created_at: string
}

export interface Property {
  id: string
  company_id: string
  customer_id: string
  name: string
  address: string
  property_type: string
  unit_number?: string
  access_notes?: string
  created_at: string
}

export interface Employee {
  id: string
  company_id: string
  profile_id?: string
  phone?: string
  name: string
  role: string
  hourly_wage: number
  billing_rate: number
  payroll_tax_rate: number
  insurance_cost_monthly: number
  benefits_monthly: number
  overhead_allocation: number
  is_active: boolean
  skills: string[]
  created_at: string
}

export interface ServiceCatalogItem {
  id: string
  company_id: string
  name: string
  category: string
  avg_labor_hours: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  suggested_price: number
  profit_margin: number
  materials: string[]
  tools: string[]
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  customer_id: string
  property_id?: string
  title: string
  description: string
  status: JobStatus
  priority: Priority
  scheduled_date?: string
  completed_date?: string
  assigned_technician_id?: string
  estimated_hours: number
  actual_hours: number
  revenue: number
  labor_cost: number
  material_cost: number
  fuel_cost: number
  overhead_cost: number
  profit: number
  profit_margin: number
  created_at: string
}

export interface JobTask {
  id: string
  job_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  estimated_hours: number
  actual_hours: number
  sort_order: number
}

export interface WorkOrder {
  id: string
  company_id: string
  customer_id?: string
  property_id?: string
  source: 'manual' | 'pdf' | 'email' | 'portal' | 'photo'
  status: 'pending' | 'processing' | 'review' | 'approved' | 'rejected'
  raw_content?: string
  ai_extracted_data?: AIExtractedData
  document_url?: string
  created_at: string
}

export interface AIExtractedData {
  customer?: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }
  property?: {
    property_type?: string
    unit_number?: string
    location?: string
  }
  job?: {
    requested_repairs?: string[]
    required_materials?: string[]
    estimated_labor_hours?: number
    priority?: Priority
    special_instructions?: string
  }
  tasks?: string[]
  estimate?: {
    labor_hours?: number
    materials?: string[]
    suggested_price_min?: number
    suggested_price_max?: number
  }
}

export interface Estimate {
  id: string
  company_id: string
  customer_id: string
  property_id?: string
  job_id?: string
  work_order_id?: string
  title: string
  status: EstimateStatus
  labor_hours: number
  labor_rate: number
  material_cost: number
  markup_percent: number
  total: number
  valid_until: string
  line_items: EstimateLineItem[]
  notes?: string
  created_at: string
}

export interface EstimateLineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  type: 'labor' | 'material' | 'service'
}

export interface Invoice {
  id: string
  company_id: string
  customer_id: string
  job_id?: string
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  amount_paid: number
  due_date: string
  paid_date?: string
  line_items: EstimateLineItem[]
  created_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  method: 'card' | 'check' | 'cash' | 'ach' | 'stripe'
  stripe_payment_id?: string
  created_at: string
}

export interface Material {
  id: string
  company_id: string
  name: string
  category: string
  supplier: string
  cost: number
  markup_percent: number
  customer_price: number
  quantity: number
  reorder_level: number
  unit: string
  created_at: string
}

export interface Vehicle {
  id: string
  company_id: string
  name: string
  type: 'truck' | 'van' | 'trailer' | 'car'
  make: string
  model: string
  year: number
  license_plate: string
  mileage: number
  is_active: boolean
  created_at: string
}

export interface FuelLog {
  id: string
  vehicle_id: string
  date: string
  miles: number
  gallons: number
  fuel_price: number
  total_cost: number
  job_id?: string
}

export interface TimeEntry {
  id: string
  company_id: string
  job_id: string
  employee_id?: string
  profile_id?: string
  start_time: string
  end_time?: string
  lat?: number
  lng?: number
  created_at: string
}

export interface JobPhoto {
  id: string
  company_id: string
  job_id: string
  url: string
  caption?: string
  created_at: string
}

export type InventoryTransactionType = 'receive' | 'job_usage' | 'adjustment' | 'return'

export interface InventoryTransaction {
  id: string
  material_id: string
  job_id?: string
  quantity_change: number
  transaction_type: InventoryTransactionType
  notes?: string
  created_at: string
}

export interface Expense {
  id: string
  company_id: string
  category: string
  description: string
  amount: number
  date: string
  job_id?: string
  vehicle_id?: string
  receipt_url?: string
  created_at: string
}

export interface ScheduleEvent {
  id: string
  company_id: string
  job_id: string
  technician_id: string
  title: string
  start_time: string
  end_time: string
  location: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export interface Notification {
  id: string
  company_id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  created_at: string
}

export interface DashboardMetrics {
  revenueToday: number
  revenueMonth: number
  openJobs: number
  completedJobs: number
  pendingEstimates: number
  laborCost: number
  materialCost: number
  fuelExpenses: number
  profitMargin: number
}

export interface ChartDataPoint {
  name: string
  value?: number
  [key: string]: string | number | undefined
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface OnboardingData {
  company: Partial<Company>
  services: Partial<ServiceCatalogItem>[]
  pricing: {
    hourly_rate: number
    emergency_multiplier: number
    weekend_multiplier: number
    property_mgmt_discount: number
  }
  employees: Partial<Employee>[]
  vehicles: Partial<Vehicle>[]
  materials: Partial<Material>[]
}
