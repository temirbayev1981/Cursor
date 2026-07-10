export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration optional in dev
    })
  })
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
