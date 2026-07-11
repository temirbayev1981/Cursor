import { publicAsset } from '@/lib/base-path'

let serviceWorkerRegistered = false
let serviceWorkerReadyPromise: Promise<boolean> | null = null

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  serviceWorkerReadyPromise = (async () => {
    try {
      const registration = await navigator.serviceWorker.register(publicAsset('sw.js'))
      await navigator.serviceWorker.ready
      serviceWorkerRegistered = Boolean(registration.active)
      return serviceWorkerRegistered
    } catch {
      serviceWorkerRegistered = false
      return false
    }
  })()
}

/** Resolves when the service worker registration attempt finishes. */
export function whenServiceWorkerReady(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(false)
  if (serviceWorkerReadyPromise) return serviceWorkerReadyPromise
  return navigator.serviceWorker.getRegistration().then((reg) => Boolean(reg?.active))
}

/** True after registerServiceWorker() activates the worker. */
export function isServiceWorkerRegistered(): boolean {
  return serviceWorkerRegistered
}

/** Browser supports service workers (not the same as an active registration). */
export function isPwaApiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

/** PWA manifest is linked from the document (production deploy). */
export function hasPwaManifestLink(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(document.querySelector('link[rel="manifest"]'))
}

/** Offline queue + active service worker + PWA shell for technician sync. */
export function isOfflineSyncReady(): boolean {
  if (!isPwaApiSupported() || !hasPwaManifestLink()) return false
  if (!isServiceWorkerRegistered()) return false
  if (typeof localStorage === 'undefined') return false
  try {
    return typeof getOfflineQueue === 'function'
  } catch {
    return false
  }
}

const OFFLINE_QUEUE_KEY = 'handymanos_offline_queue'

export interface OfflineAction {
  id: string
  type: string
  payload: unknown
  created_at: string
}

export function queueOfflineAction(type: string, payload: unknown) {
  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as OfflineAction[]
    queue.unshift({
      id: crypto.randomUUID(),
      type,
      payload,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(0, 50)))
  } catch {
    // ignore
  }
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as OfflineAction[]
  } catch {
    return []
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export function removeOfflineActions(ids: string[]) {
  if (ids.length === 0) return
  const remaining = getOfflineQueue().filter((a) => !ids.includes(a.id))
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining))
}

export interface OfflineSyncResult {
  processed: number
  failed: number
}

export async function syncOfflineQueue(
  applyAction: (action: OfflineAction) => Promise<boolean>
): Promise<OfflineSyncResult> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { processed: 0, failed: 0 }

  const syncedIds: string[] = []
  let failed = 0

  for (const action of [...queue].reverse()) {
    try {
      const ok = await applyAction(action)
      if (ok) syncedIds.push(action.id)
      else failed++
    } catch {
      failed++
    }
  }

  removeOfflineActions(syncedIds)
  return { processed: syncedIds.length, failed }
}
