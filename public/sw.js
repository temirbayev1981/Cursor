/// <reference lib="webworker" />

const CACHE_NAME = 'handymanos-v3'
const SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg']

function isNavigationRequest(request) {
  return request.mode === 'navigate' || SHELL.includes(new URL(request.url).pathname)
}

function isCacheableAsset(pathname) {
  return pathname.endsWith('.js') || pathname.endsWith('.css') || pathname.endsWith('.woff2')
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

  // HTML/navigation: network-first so deploys are visible immediately
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res.ok && isCacheableAsset(url.pathname)) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return res
      })
      return cached || network
    })
  )
})
