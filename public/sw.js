/// <reference lib="webworker" />

const CACHE_NAME = 'handymanos-v6'
const OFFLINE_INDEX = '/index.html'
const SHELL = ['/manifest.json', '/favicon.svg']

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.url.endsWith('/') || request.url.endsWith('/index.html')
}

function isHashedAsset(pathname) {
  return pathname.startsWith('/assets/') && (pathname.endsWith('.js') || pathname.endsWith('.css'))
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // HTML/navigation: network-first, cache latest index for offline cold start
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_INDEX, clone))
          }
          return res
        })
        .catch(() => caches.match(OFFLINE_INDEX))
    )
    return
  }

  // Hashed bundles: network-only — never serve cached HTML fallback as JS/CSS
  if (isHashedAsset(url.pathname)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((res) => {
          const type = res.headers.get('content-type') || ''
          if (res.ok && !type.includes('text/html')) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        .catch(() => fetch(event.request, { cache: 'reload' }))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
