import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { listEntities, saveEntity, createJobFromVendorPO, createEstimateFromJob, listFuelLogs } from '@/services/entity-service'
import { recordInvoicePayment, sendInvoiceToCustomer } from '@/services/payment-service'
import type { Job, Customer, Estimate, Invoice } from '@/types'
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
  return useMutation({
    mutationFn: (customer: Customer) => saveEntity('customers', customer),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers', companyId] }),
  })
}

export function useSaveJob() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: (job: Job) => saveEntity('jobs', job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs', companyId] }),
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
  return useMutation({
    mutationFn: (job: Job) => createEstimateFromJob(job, companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates', companyId] }),
  })
}

export function useUpdateJobStatus() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: async ({ job, status }: { job: Job; status: Job['status'] }) =>
      saveEntity('jobs', { ...job, status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs', companyId] }),
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
  return useMutation({
    mutationFn: ({ invoice, amount }: { invoice: Invoice; amount: number }) =>
      recordInvoicePayment(invoice, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', companyId] }),
  })
}

export function useSendInvoice() {
  const qc = useQueryClient()
  const companyId = useCompanyId()
  return useMutation({
    mutationFn: ({ invoice, email }: { invoice: Invoice; email: string }) =>
      sendInvoiceToCustomer(invoice, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', companyId] }),
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
