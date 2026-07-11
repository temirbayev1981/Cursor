import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { listEntities, saveEntity, deleteEntity, createJobFromVendorPO, createEstimateFromJob, createInvoiceFromEstimate, createScheduleFromJob, importSampleData, listFuelLogs, saveFuelLog, listAuditLogs, logAudit } from '@/services/entity-service'
import { recordInvoicePayment, sendInvoiceToCustomer } from '@/services/payment-service'
import { listInventoryTransactions, applyMaterialsOnJob, receiveStock } from '@/services/inventory-service'
import type { Job, Customer, Estimate, Invoice, Employee, Material, Vehicle, Expense, FuelLog } from '@/types'
import type { VendorPORecord } from '@/types/vendor-po'

function useCompanyId() {
  const { company } = useAuth()
  return company?.id ?? 'comp-001'
}

function useCompanyQueryScope() {
  const { company, isLoading } = useAuth()
  const companyId = company?.id ?? ''
  return {
    companyId,
    enabled: !isLoading && Boolean(company?.id),
    queryKey: company?.id ?? 'pending',
  }
}

export function useJobs() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['jobs', queryKey], queryFn: () => listEntities('jobs', companyId), enabled })
}

export function useCustomers() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['customers', queryKey], queryFn: () => listEntities('customers', companyId), enabled })
}

export function useEstimates() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['estimates', queryKey], queryFn: () => listEntities('estimates', companyId), enabled })
}

export function useInvoices() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['invoices', queryKey], queryFn: () => listEntities('invoices', companyId), enabled })
}

export function useEmployees() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['employees', queryKey], queryFn: () => listEntities('employees', companyId), enabled })
}

export function useSchedules() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['schedules', queryKey], queryFn: () => listEntities('schedules', companyId), enabled })
}

export function useProperties() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['properties', queryKey], queryFn: () => listEntities('properties', companyId), enabled })
}

export function useMaterials() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['materials', queryKey], queryFn: () => listEntities('materials', companyId), enabled })
}

export function useVehicles() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['vehicles', queryKey], queryFn: () => listEntities('vehicles', companyId), enabled })
}

export function useExpenses() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['expenses', queryKey], queryFn: () => listEntities('expenses', companyId), enabled })
}

export function useWorkOrders() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['workOrders', queryKey], queryFn: () => listEntities('workOrders', companyId), enabled })
}

export function useServices() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['services', queryKey], queryFn: () => listEntities('services', companyId), enabled })
}

export function useFuelLogs() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({ queryKey: ['fuelLogs', queryKey], queryFn: () => listFuelLogs(companyId), enabled })
}

export function useSaveWorkOrder() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: (wo: import('@/types').WorkOrder) => saveEntity('workOrders', wo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workOrders', companyId] }),
  })
}

export function useSaveCustomer() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (customer: Customer) => {
      const existing = await listEntities('customers', companyId) as Customer[]
      const isNew = !existing.some((c) => c.id === customer.id)
      await saveEntity('customers', customer)
      return { customer, isNew }
    },
    onSuccess: ({ customer, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'customer.create' : 'customer.update',
          'customer',
          customer.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['customers', companyId] })
    },
  })
}

export function useSaveJob() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (job: Job) => {
      const existing = await listEntities('jobs', companyId) as Job[]
      const isNew = !existing.some((j) => j.id === job.id)
      await saveEntity('jobs', job)
      return { job, isNew }
    },
    onSuccess: ({ job, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'job.create' : 'job.update',
          'job',
          job.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useCreateJobFromPO() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: (po: VendorPORecord) => createJobFromVendorPO(po, companyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
      qc.invalidateQueries({ queryKey: ['estimates', companyId] })
    },
  })
}

export function useCreateEstimateFromJob() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (job: Job) => createEstimateFromJob(job, companyId),
    onSuccess: (estimate) => {
      qc.invalidateQueries({ queryKey: ['estimates', companyId] })
      if (user) void logAudit(companyId, user.id, 'estimate.create', 'estimate', estimate.id)
    },
  })
}

export function useUpdateJobStatus() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ job, status }: { job: Job; status: Job['status'] }) =>
      saveEntity('jobs', { ...job, status }),
    onSuccess: (_data, { job }) => {
      if (user) void logAudit(companyId, user.id, 'job.status_change', 'job', job.id)
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useBulkUpdateJobStatus() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ jobs, status }: { jobs: Job[]; status: Job['status'] }) => {
      for (const job of jobs) {
        await saveEntity('jobs', { ...job, status })
      }
    },
    onSuccess: (_data, { jobs, status }) => {
      if (user && status === 'cancelled') {
        for (const job of jobs) {
          void logAudit(companyId, user.id, 'jobs.bulk_cancel', 'job', job.id)
        }
      }
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useBulkAssignTechnician() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ jobs, technicianId }: { jobs: Job[]; technicianId: string }) => {
      for (const job of jobs) {
        await saveEntity('jobs', { ...job, assigned_technician_id: technicianId })
      }
    },
    onSuccess: (_data, { jobs }) => {
      if (user) {
        for (const job of jobs) {
          void logAudit(companyId, user.id, 'jobs.bulk_assign', 'job', job.id)
        }
      }
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useBulkScheduleJobs() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ jobs, technicianId }: { jobs: Job[]; technicianId: string }) => {
      const scheduledDate = new Date().toISOString()
      for (const job of jobs) {
        await saveEntity('jobs', {
          ...job,
          status: 'scheduled',
          assigned_technician_id: technicianId,
          scheduled_date: job.scheduled_date ?? scheduledDate,
        })
      }
    },
    onSuccess: (_data, { jobs }) => {
      if (user) {
        for (const job of jobs) {
          void logAudit(companyId, user.id, 'jobs.bulk_schedule', 'job', job.id)
        }
      }
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useBulkDeleteJobs() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (jobs: Job[]) => {
      for (const job of jobs) {
        await deleteEntity('jobs', job.id)
      }
      return jobs
    },
    onSuccess: (jobs) => {
      if (user) {
        for (const job of jobs) {
          void logAudit(companyId, user.id, 'jobs.bulk_delete', 'job', job.id)
        }
      }
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useSaveInvoice() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: (invoice: Invoice) => saveEntity('invoices', invoice),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', companyId] }),
  })
}

export function usePayInvoice() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: ({ invoice, amount }: { invoice: Invoice; amount: number }) =>
      recordInvoicePayment(invoice, amount),
    onSuccess: (_data, { invoice }) => {
      if (user) void logAudit(companyId, user.id, 'invoice.payment', 'invoice', invoice.id)
      qc.invalidateQueries({ queryKey: ['invoices', companyId] })
    },
  })
}

export function useSendInvoice() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: ({ invoice, email, customer }: { invoice: Invoice; email: string; customer?: Customer }) =>
      sendInvoiceToCustomer(invoice, email, invoice.customer_id, customer),
    onSuccess: (_data, { invoice }) => {
      if (user) void logAudit(companyId, user.id, 'invoice.sent', 'invoice', invoice.id)
      qc.invalidateQueries({ queryKey: ['invoices', companyId] })
    },
  })
}

export function useSaveEstimate() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: (estimate: Estimate) => saveEntity('estimates', estimate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates', companyId] }),
  })
}

export function useConvertEstimateToInvoice() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ estimate, invoiceNumber }: { estimate: Estimate; invoiceNumber: string }) =>
      createInvoiceFromEstimate(estimate, companyId, invoiceNumber),
    onSuccess: (invoice) => {
      if (user) void logAudit(companyId, user.id, 'invoice.create', 'invoice', invoice.id)
      qc.invalidateQueries({ queryKey: ['estimates', companyId] })
      qc.invalidateQueries({ queryKey: ['invoices', companyId] })
    },
  })
}

export function useSaveProperty() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (property: import('@/types').Property) => {
      const existing = await listEntities('properties', companyId) as import('@/types').Property[]
      const isNew = !existing.some((p) => p.id === property.id)
      await saveEntity('properties', property)
      return { property, isNew }
    },
    onSuccess: ({ property, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'property.create' : 'property.update',
          'property',
          property.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['properties', companyId] })
    },
  })
}

export function useSaveEmployee() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (employee: Employee) => {
      const existing = await listEntities('employees', companyId) as Employee[]
      const isNew = !existing.some((e) => e.id === employee.id)
      await saveEntity('employees', employee)
      return { employee, isNew }
    },
    onSuccess: ({ employee, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'employee.create' : 'employee.update',
          'employee',
          employee.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['employees', companyId] })
    },
  })
}

export function useSaveMaterial() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (material: Material) => {
      const existing = await listEntities('materials', companyId) as Material[]
      const isNew = !existing.some((m) => m.id === material.id)
      await saveEntity('materials', material)
      return { material, isNew }
    },
    onSuccess: ({ material, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'material.create' : 'material.update',
          'material',
          material.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['materials', companyId] })
    },
  })
}

export function useSaveVehicle() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (vehicle: Vehicle) => {
      const existing = await listEntities('vehicles', companyId) as Vehicle[]
      const isNew = !existing.some((v) => v.id === vehicle.id)
      await saveEntity('vehicles', vehicle)
      return { vehicle, isNew }
    },
    onSuccess: ({ vehicle, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'vehicle.create' : 'vehicle.update',
          'vehicle',
          vehicle.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['vehicles', companyId] })
      qc.invalidateQueries({ queryKey: ['fuelLogs', companyId] })
    },
  })
}

export function useSaveFuelLog() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (log: FuelLog) => {
      const existing = await listFuelLogs(companyId)
      const isNew = !existing.some((item) => item.id === log.id)
      await saveFuelLog(log)
      return { log, isNew }
    },
    onSuccess: ({ log, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'fuel_log.create' : 'fuel_log.update',
          'fuel_log',
          log.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['fuelLogs', companyId] })
    },
  })
}

export function useSaveExpense() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (expense: Expense) => {
      const existing = await listEntities('expenses', companyId) as Expense[]
      const isNew = !existing.some((e) => e.id === expense.id)
      await saveEntity('expenses', expense)
      return { expense, isNew }
    },
    onSuccess: ({ expense, isNew }) => {
      if (user) {
        void logAudit(
          companyId,
          user.id,
          isNew ? 'expense.create' : 'expense.update',
          'expense',
          expense.id,
        )
      }
      qc.invalidateQueries({ queryKey: ['expenses', companyId] })
    },
  })
}

export function useCreateScheduleFromJob() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      job,
      technicianId,
      startTime,
      endTime,
      location,
    }: {
      job: Job
      technicianId: string
      startTime: string
      endTime: string
      location: string
    }) => createScheduleFromJob(job, companyId, technicianId, startTime, endTime, location),
    onSuccess: (schedule) => {
      if (user) void logAudit(companyId, user.id, 'schedule.create', 'schedule', schedule.id)
      qc.invalidateQueries({ queryKey: ['schedules', companyId] })
      qc.invalidateQueries({ queryKey: ['jobs', companyId] })
    },
  })
}

export function useImportSampleData() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: () => importSampleData(companyId),
    onSuccess: () => {
      if (user) void logAudit(companyId, user.id, 'sample.import', 'company', companyId)
      qc.invalidateQueries()
    },
  })
}

export function useGlobalSearch(query: string) {
  const { companyId, enabled: companyReady, queryKey } = useCompanyQueryScope()
  return useQuery({
    queryKey: ['search', queryKey, query],
    queryFn: async () => {
      if (!query || query.length < 2) return { jobs: [], customers: [], estimates: [] as Estimate[], invoices: [] as Invoice[] }
      const q = query.toLowerCase()
      const [jobs, customers, estimates, invoices] = await Promise.all([
        listEntities('jobs', companyId),
        listEntities('customers', companyId),
        listEntities('estimates', companyId),
        listEntities('invoices', companyId),
      ])
      return {
        jobs: (jobs as Job[]).filter((j) => j.title.toLowerCase().includes(q)).slice(0, 5),
        customers: (customers as Customer[]).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5),
        estimates: (estimates as Estimate[]).filter((e) => e.title.toLowerCase().includes(q)).slice(0, 5),
        invoices: (invoices as Invoice[]).filter((i) => i.invoice_number.toLowerCase().includes(q)).slice(0, 5),
      }
    },
    enabled: companyReady && query.length >= 2,
  })
}

export function useInventoryTransactionsList() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({
    queryKey: ['inventory', queryKey],
    queryFn: () => listInventoryTransactions(companyId),
    enabled,
  })
}

export function useInventoryTransactions() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (params: {
      companyId: string
      jobId: string
      items: { materialId: string; quantity: number }[]
    }) => applyMaterialsOnJob(params.companyId, params.jobId, params.items),
    onSuccess: (_transactions, params) => {
      if (user) void logAudit(companyId, user.id, 'inventory.apply', 'job', params.jobId)
      qc.invalidateQueries({ queryKey: ['inventory', companyId] })
      qc.invalidateQueries({ queryKey: ['materials', companyId] })
    },
  })
}

export function useReceiveStock() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (params: { materialId: string; quantity: number; notes?: string }) =>
      receiveStock(companyId, params.materialId, params.quantity, params.notes),
    onSuccess: (_transaction, params) => {
      if (user) void logAudit(companyId, user.id, 'inventory.receive', 'material', params.materialId)
      qc.invalidateQueries({ queryKey: ['inventory', companyId] })
      qc.invalidateQueries({ queryKey: ['materials', companyId] })
    },
  })
}

export function useAuditLogs() {
  const { companyId, enabled, queryKey } = useCompanyQueryScope()
  return useQuery({
    queryKey: ['auditLogs', queryKey],
    queryFn: () => listAuditLogs(companyId),
    enabled,
  })
}
