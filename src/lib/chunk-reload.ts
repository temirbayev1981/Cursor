const RELOAD_KEY = 'handymanos_chunk_reload'

const CHUNK_ERROR_RE =
  /chunk|dynamically imported|importing a module|Loading CSS module|Failed to fetch dynamically imported module/i

export function isChunkLoadError(message: string): boolean {
  return CHUNK_ERROR_RE.test(message)
}

export function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    void reloadOnceForStaleAssets()
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason ?? '')
    if (!isChunkLoadError(message)) return
    event.preventDefault()
    void reloadOnceForStaleAssets()
  })
}

async function reloadOnceForStaleAssets(): Promise<void> {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') return
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    // sessionStorage may be unavailable
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration?.update()
    }
  } catch {
    // best-effort cache clear before reload
  }

  window.location.reload()
}
