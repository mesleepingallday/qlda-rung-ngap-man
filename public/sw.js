// Offline support for field use (weak signal at Rú Chá).
// - App shell & data: available offline after the first visit.
// - Hashed build assets (/_nuxt/*): cache-first, they never change.
// - Data (/data/*): stale-while-revalidate.
// - Satellite tiles: cache-first with a small cap (study area only).
const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const ASSETS = `assets-${VERSION}`
const DATA = `data-${VERSION}`
const TILES = `tiles-${VERSION}`
const PRECACHE = ['/', '/manifest.webmanifest', '/data/patches.geojson', '/data/context.geojson', '/icons/icon.svg', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, ASSETS, DATA, TILES])
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // SPA navigations: network first, fall back to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((res) => {
      const copy = res.clone()
      caches.open(SHELL).then((c) => c.put('/', copy))
      return res
    }).catch(() => caches.match('/')))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/_nuxt/')) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then((c) => c.put(request, copy)) }
      return res
    })))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/data/')) {
    event.respondWith(caches.open(DATA).then(async (c) => {
      const hit = await c.match(request)
      const net = fetch(request).then((res) => { if (res.ok) c.put(request, res.clone()); return res }).catch(() => hit)
      return hit || net
    }))
    return
  }

  if (url.hostname === 'server.arcgisonline.com') {
    event.respondWith(caches.open(TILES).then(async (c) => {
      const hit = await c.match(request)
      if (hit) return hit
      const res = await fetch(request)
      if (res.ok || res.type === 'opaque') { c.put(request, res.clone()); trim(TILES, 400) }
      return res
    }))
  }
})
