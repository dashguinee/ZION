/**
 * DASH⚡ Service Worker
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'dash-webtv-v3'
const OFFLINE_URL = '/offline.html'

// Files to cache on install - only essential ones
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/theme.css',
  '/css/components.css',
  '/js/app.js',
  '/js/xtream-client.js',
  '/js/pwa.js',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Caching static assets')
      // Cache each file individually, skip failures
      for (const url of STATIC_CACHE_URLS) {
        try {
          await cache.add(url)
        } catch (e) {
          console.warn('[Service Worker] Failed to cache:', url, e)
        }
      }
    })
  )

  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip API calls - always fetch fresh
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/player_api.php') || url.pathname.includes('/get.php')) {
    return // Let the browser handle it normally
  }

  // For video streams, don't cache
  if (request.url.includes('/live/') || request.url.includes('/movie/') || request.url.includes('/series/')) {
    event.respondWith(fetch(request))
    return
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', request.url)
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If both cache and network fail, show offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
        })
    })
  )
})

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Push notification support (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received')

  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('DASH⚡', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked')

  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})
