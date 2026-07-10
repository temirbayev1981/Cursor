import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { listEntities, saveEntity, deleteEntity, createJobFromVendorPO, createEstimateFromJob, createInvoiceFromEstimate, createScheduleFromJob, importSampleData, listFuelLogs, listAuditLogs, logAudit } from '@/services/entity-service'
import { recordInvoicePayment, sendInvoiceToCustomer } from '@/services/payment-service'
import { listInventoryTransactions, applyMaterialsOnJob, receiveStock } from '@/services/inventory-service'
import type { Job, Customer, Estimate, Invoice, Employee, Material, Vehicle, Expense } from '@/types'
import type { VendorPORecord } from '@/types/vendor-po'

function useCompanyId() {
  const { company } = useAuth()
  return company?.id ?? 'comp-001'
}

export function useJobs() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['jobs', companyId], queryFn: () => listEntities('jobs', companyId) })
}

export function useCustomers() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['customers', companyId], queryFn: () => listEntities('customers', companyId) })
}

export function useEstimates() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['estimates', companyId], queryFn: () => listEntities('estimates', companyId) })
}

export function useInvoices() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['invoices', companyId], queryFn: () => listEntities('invoices', companyId) })
}

export function useEmployees() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['employees', companyId], queryFn: () => listEntities('employees', companyId) })
}

export function useSchedules() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['schedules', companyId], queryFn: () => listEntities('schedules', companyId) })
}

export function useProperties() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['properties', companyId], queryFn: () => listEntities('properties', companyId) })
}

export function useMaterials() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['materials', companyId], queryFn: () => listEntities('materials', companyId) })
}

export function useVehicles() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['vehicles', companyId], queryFn: () => listEntities('vehicles', companyId) })
}

export function useExpenses() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['expenses', companyId], queryFn: () => listEntities('expenses', companyId) })
}

export function useWorkOrders() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['workOrders', companyId], queryFn: () => listEntities('workOrders', companyId) })
}

export function useServices() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['services', companyId], queryFn: () => listEntities('services', companyId) })
}

export function useFuelLogs() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ['fuelLogs', companyId], queryFn: () => listFuelLogs(companyId) })
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
    mutationFn: ({ invoice, email }: { invoice: Invoice; email: string }) =>
      sendInvoiceToCustomer(invoice, email),
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
  return useMutation({
    mutationFn: (employee: Employee) => saveEntity('employees', employee),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', companyId] }),
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
  return useMutation({
    mutationFn: (vehicle: Vehicle) => saveEntity('vehicles', vehicle),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles', companyId] })
      qc.invalidateQueries({ queryKey: ['fuelLogs', companyId] })
    },
  })
}

export function useSaveExpense() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: (expense: Expense) => saveEntity('expenses', expense),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', companyId] }),
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
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['search', companyId, query],
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
    enabled: query.length >= 2,
  })
}

export function useInventoryTransactionsList() {
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['inventory', companyId],
    queryFn: () => listInventoryTransactions(companyId),
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
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['auditLogs', companyId],
    queryFn: () => listAuditLogs(companyId),
  })
}
