// Service Worker Manual para PWA - sistemasJaihom
// Versión: 1.0.0 - Generado: 2026-01-10T11:50:39.104Z
// Versión: 1.0.0 - Generado: 2026-01-10T11:44:21.393Z
// Versión: 1.0.0 - Generado: 2026-01-10T02:18:01.870Z
// Versión: 1.0.0 - Generado: 2026-01-10T02:14:16.576Z
// Versión: 1.0.0 - Generado: 2026-01-09T19:17:31.818Z
// Versión: 1.2.0 - Generado: 2026-01-09T19:16:23.613Z
// Versión: 1.2.0 - Generado: 2026-01-09T19:15:49.528Z
// Versión: 1.2.0 - Generado: 2026-01-09T19:14:45.839Z
// Versión: 1.2.0 - Generado: 2026-01-09T19:14:01.489Z
// Versión: 1.2.0 - Generado: 2026-01-09T19:10:53.892Z
// Versión: 1.2.0 - Generado: 2025-11-08T01:37:16.616Z
// Versión: 1.1.0 - Generado: 2025-10-12T02:08:13.917Z
// Versión: 1.0.0 - Generado: 2025-10-12T01:48:15.887Z
const CACHE_NAME = 'jaihom-erp-v1-0-0';
const RUNTIME_CACHE = 'jaihom-runtime-v1-0-0';
const IMAGE_CACHE = 'jaihom-images-v1-0-0';

// Archivos estáticos para cachear en la instalación
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// Instalar el service worker y cachear archivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el service worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estrategia de caché: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // No cachear peticiones a APIs externas o autenticación
  if (url.pathname.includes('/api/') ||
    url.pathname.includes('/_next/webpack') ||
    url.pathname.includes('hot-update')) {
    return;
  }

  // Estrategia para imágenes: Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Estrategia para assets estáticos de Next.js: Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Estrategia para páginas: Network First con fallback a Cache
  event.respondWith(networkFirstStrategy(request));
});

// Estrategia Cache First: Busca en caché primero, luego en red
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Error in cacheFirstStrategy:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Sin conexión', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estrategia Network First: Intenta red primero, luego caché
async function networkFirstStrategy(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
      console.log('[SW] Fetching from network:', request.url);
      const networkResponse = await fetch(request);

      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache:', request.url);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no hay caché, intentar servir la página principal para navegación
      if (request.mode === 'navigate') {
        const fallbackResponse = await cache.match('/');
        if (fallbackResponse) {
          return fallbackResponse;
        }
      }

      throw networkError;
    }
  } catch (error) {
    console.error('[SW] Error in networkFirstStrategy:', error);
    return new Response('Sin conexión y sin caché disponible', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

