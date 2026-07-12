import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { VendorPORecord } from '@/types/vendor-po'
import { createJobFromVendorPO, createEstimateFromJob, logAudit } from '@/services/entity-service'
import { updateVendorPOStatus } from '@/services/vendor-po-service'
import type { Job } from '@/types'

interface WorkflowContextType {
  runVendorPOWorkflow: (po: VendorPORecord, companyId: string, userId: string) => Promise<{ job: Job }>
  isRunning: boolean
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false)

  const runVendorPOWorkflow = useCallback(async (po: VendorPORecord, companyId: string, userId: string) => {
    setIsRunning(true)
    try {
      const job = await createJobFromVendorPO(po, companyId)
      const estimate = await createEstimateFromJob(job, companyId)
      await logAudit(companyId, userId, 'estimate.create', 'estimate', estimate.id)
      await updateVendorPOStatus(po.id, 'approved')
      await logAudit(companyId, userId, 'vendor_po_to_job', 'job', job.id)

      const priority = po.priority ?? ''
      if (priority.includes('EMERGENCY') || priority.startsWith('P1')) {
        await logAudit(companyId, userId, 'emergency_alert', 'vendor_po', po.id)
      }

      return { job }
    } finally {
      setIsRunning(false)
    }
  }, [])

  return (
    <WorkflowContext.Provider value={{ runVendorPOWorkflow, isRunning }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext)
  if (!ctx) throw new Error('useWorkflow must be used within WorkflowProvider')
  return ctx
}
