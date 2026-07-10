import type { InventoryTransaction, InventoryTransactionType, Material } from '@/types'
import { listEntities, saveEntity } from '@/services/entity-service'
import { loadStore, saveStore, upsertStore, STORE_KEYS } from '@/lib/data-store'
import { supabase } from '@/lib/supabase'
import { insertRows } from '@/lib/supabase-queries'

export async function listInventoryTransactions(companyId: string): Promise<InventoryTransaction[]> {
  const materials = await listEntities('materials', companyId)
  const materialIdList = materials.map((m) => m.id)
  const local = loadStore<InventoryTransaction>(STORE_KEYS.inventory)
    .filter((t) => materialIdList.includes(t.material_id))

  if (!supabase) return local

  if (materialIdList.length === 0) return local

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .in('material_id', materialIdList)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error
    const items = (data ?? []) as InventoryTransaction[]
    if (items.length > 0) {
      saveStore(STORE_KEYS.inventory, items)
      return items
    }
    return local
  } catch {
    return local
  }
}

export async function recordInventoryTransaction(
  companyId: string,
  materialId: string,
  quantityChange: number,
  transactionType: InventoryTransactionType,
  options?: { jobId?: string; notes?: string }
): Promise<{ transaction: InventoryTransaction; material: Material }> {
  const materials = await listEntities('materials', companyId)
  const material = materials.find((m) => m.id === materialId)
  if (!material) throw new Error('Material not found')

  const newQuantity = Math.max(0, material.quantity + quantityChange)
  const updatedMaterial = await saveEntity('materials', { ...material, quantity: newQuantity })

  const transaction: InventoryTransaction = {
    id: crypto.randomUUID(),
    material_id: materialId,
    job_id: options?.jobId,
    quantity_change: quantityChange,
    transaction_type: transactionType,
    notes: options?.notes,
    created_at: new Date().toISOString(),
  }

  upsertStore(STORE_KEYS.inventory, transaction)

  if (!supabase) return { transaction, material: updatedMaterial }

  await insertRows('inventory', transaction)

  return { transaction, material: updatedMaterial }
}

export async function applyMaterialsOnJob(
  companyId: string,
  jobId: string,
  items: { materialId: string; quantity: number }[]
): Promise<InventoryTransaction[]> {
  const results: InventoryTransaction[] = []

  for (const item of items) {
    if (item.quantity <= 0) continue
    const { transaction } = await recordInventoryTransaction(
      companyId,
      item.materialId,
      -item.quantity,
      'job_usage',
      { jobId, notes: `Job ${jobId}` }
    )
    results.push(transaction)
  }

  return results
}

export async function receiveStock(
  companyId: string,
  materialId: string,
  quantity: number,
  notes?: string
): Promise<InventoryTransaction> {
  const { transaction } = await recordInventoryTransaction(
    companyId,
    materialId,
    quantity,
    'receive',
    { notes }
  )
  return transaction
}
